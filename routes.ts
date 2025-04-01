import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { parse } from "csv-parse";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import stringSimilarity from "string-similarity";
import { CSVRecord, InsertCustomer, Customer, DuplicateGroup } from "@shared/schema";
import { generateMergeReport, generateMergedCsv } from "./pdf-generator";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Simple fuzzy match function based on string-similarity
function fuzzyMatch(str1: string, str2: string): number {
  return stringSimilarity.compareTwoStrings(
    str1.toLowerCase().trim(),
    str2.toLowerCase().trim()
  );
}

// Find potential duplicates in customer records
function findDuplicates(customers: Customer[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const processed = new Set<number>();

  // First pass: Group by phone number (strongest matches)
  const phoneGroups = new Map<string, Customer[]>();
  
  for (const customer of customers) {
    if (processed.has(customer.id)) continue;
    
    const phone = (customer.phone || '').replace(/\s+/g, '').replace(/[-()]/g, '').trim();
    if (phone) {
      if (!phoneGroups.has(phone)) {
        phoneGroups.set(phone, []);
      }
      phoneGroups.get(phone)!.push(customer);
      processed.add(customer.id);
    }
  }
  
  // Convert phone groups to duplicate groups
  phoneGroups.forEach((members, phone) => {
    if (members.length > 1) {
      const mainCustomer = members[0];
      const mainName = `${mainCustomer.firstName} ${mainCustomer.lastName}`;
      
      groups.push({
        id: uuidv4(),
        name: mainName,
        records: members,
        confidence: 95,
        matchReason: 'Phone number exact match'
      });
    }
  });

  // Second pass: Group by exact full name match for records without phones
  const nameGroups = new Map<string, Customer[]>();
  
  for (const customer of customers) {
    if (processed.has(customer.id)) continue;
    
    const fullName = `${customer.firstName?.toLowerCase().trim() || ''} ${customer.lastName?.toLowerCase().trim() || ''}`.trim();
    if (fullName) {
      if (!nameGroups.has(fullName)) {
        nameGroups.set(fullName, []);
      }
      nameGroups.get(fullName)!.push(customer);
      processed.add(customer.id);
    }
  }
  
  // Convert name groups to duplicate groups
  nameGroups.forEach((members, name) => {
    if (members.length > 1) {
      const mainCustomer = members[0];
      
      groups.push({
        id: uuidv4(),
        name,
        records: members,
        confidence: 90,
        matchReason: 'Full name exact match'
      });
    }
  });

  // Third pass: Use fuzzy matching for remaining records
  for (let i = 0; i < customers.length; i++) {
    if (processed.has(customers[i].id)) continue;
    
    const potentialGroup: Customer[] = [customers[i]];
    processed.add(customers[i].id);
    
    for (let j = i + 1; j < customers.length; j++) {
      if (processed.has(customers[j].id)) continue;
      
      // Get data for comparison
      const firstName1 = customers[i].firstName?.toLowerCase().trim() || '';
      const firstName2 = customers[j].firstName?.toLowerCase().trim() || '';
      
      const lastName1 = customers[i].lastName?.toLowerCase().trim() || '';
      const lastName2 = customers[j].lastName?.toLowerCase().trim() || '';
      
      // Check for fuzzy name matching
      const firstNameSimilarity = fuzzyMatch(firstName1, firstName2);
      const lastNameSimilarity = fuzzyMatch(lastName1, lastName2);
      
      // Consider a match if both first and last name have good similarity
      if ((firstNameSimilarity > 0.85 && lastNameSimilarity > 0.75) || 
          (firstNameSimilarity > 0.75 && lastNameSimilarity > 0.85)) {
        potentialGroup.push(customers[j]);
        processed.add(customers[j].id);
      }
    }
    
    if (potentialGroup.length > 1) {
      const mainName = `${potentialGroup[0].firstName} ${potentialGroup[0].lastName}`;
      const confidence = potentialGroup.length > 2 ? 80 : 85;
      
      groups.push({
        id: uuidv4(),
        name: mainName,
        records: potentialGroup,
        confidence,
        matchReason: 'Similar name information'
      });
    }
  }
  
  return groups;
}

// Helper to convert CSV records to customer data
function csvToCustomer(record: CSVRecord): InsertCustomer {
  // Split the name into first and last name if needed
  let firstName = record.Nombre || "";
  let lastName = record.Apellido || "";
  
  // Parse the phone number (remove extra spaces)
  const phone = record.Teléfono?.trim() || "";
  
  // Generate a unique customer ID
  const customerId = `CU-${10000 + Math.floor(Math.random() * 90000)}`;
  
  return {
    customerId,
    firstName,
    lastName,
    phone,
    address: record.Dirección || "",
    zone: record.Zona || "",
    isMerged: false,
    mergedFrom: [],
    status: "clean"
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Get all customers
  app.get("/api/customers", async (_req: Request, res: Response) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  // Get a single customer by ID
  app.get("/api/customers/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }

      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  // Search customers
  app.get("/api/customers/search/:term", async (req: Request, res: Response) => {
    try {
      const term = req.params.term;
      const customers = await storage.searchCustomers(term);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to search customers" });
    }
  });

  // Upload and process CSV file
  app.post("/api/upload", upload.single("file"), async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      const filePath = req.file.path;
      const records: CSVRecord[] = [];
      
      // Parse CSV file
      const parser = fs
        .createReadStream(filePath)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true,
          trim: true
        }));
      
      for await (const record of parser) {
        records.push(record);
      }
      
      // Convert CSV records to customer data
      const customers = records.map(csvToCustomer);
      
      // Save all customers to database
      const savedCustomers = await storage.bulkCreateCustomers(customers);
      
      // Save file history
      await storage.createFileHistory({
        filename: req.file.originalname,
        recordCount: records.length,
        duplicatesFound: 0 // Will be updated later
      });
      
      // Clean up temp file
      fs.unlinkSync(filePath);
      
      res.json({ 
        message: "File uploaded and processed successfully", 
        recordCount: records.length,
        customers: savedCustomers
      });
    } catch (error) {
      console.error("Error processing CSV:", error);
      res.status(500).json({ message: "Failed to process CSV file" });
    }
  });

  // Get file history
  app.get("/api/file-history", async (_req: Request, res: Response) => {
    try {
      const history = await storage.getFileHistories();
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch file history" });
    }
  });
  
  // Clear all data (customers and file history)
  app.delete("/api/clear-all-data", async (_req: Request, res: Response) => {
    try {
      // Clear all stored data
      await storage.clearAllData();
      
      console.log("All data has been cleared successfully");
      
      res.json({ 
        message: "All data has been cleared successfully",
        success: true
      });
    } catch (error) {
      console.error("Error clearing data:", error);
      res.status(500).json({ message: "Failed to clear data" });
    }
  });

  // Find potential duplicates among all customers
  app.get("/api/find-duplicates", async (_req: Request, res: Response) => {
    try {
      const customers = await storage.getCustomers();
      const duplicateGroups = findDuplicates(customers);
      
      res.json({ 
        duplicateGroups,
        total: duplicateGroups.length
      });
    } catch (error) {
      console.error("Error finding duplicates:", error);
      res.status(500).json({ message: "Failed to find duplicate records" });
    }
  });

  // Merge duplicate customers
  app.post("/api/merge-duplicates", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        groupId: z.string(),
        primaryId: z.number(),
        recordIds: z.array(z.number())
      });
      
      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid request data" });
      }
      
      const { primaryId, recordIds } = validationResult.data;
      
      // Get primary record
      const primaryRecord = await storage.getCustomer(primaryId);
      if (!primaryRecord) {
        return res.status(404).json({ message: "Primary record not found" });
      }
      
      // Get secondary records to merge
      const secondaryIds = recordIds.filter(id => id !== primaryId);
      const secondaryRecords: Customer[] = [];
      
      for (const id of secondaryIds) {
        const record = await storage.getCustomer(id);
        if (record) {
          secondaryRecords.push(record);
        }
      }
      
      // Update primary record
      const mergedIds = secondaryRecords.map(r => r.customerId);
      await storage.updateCustomer(primaryId, {
        ...primaryRecord,
        isMerged: true,
        mergedFrom: [...(primaryRecord.mergedFrom || []), ...mergedIds],
        status: "merged"
      });
      
      // Delete or mark secondary records
      for (const record of secondaryRecords) {
        await storage.updateCustomer(record.id, {
          ...record,
          status: "merged_into",
          isMerged: true
        });
      }
      
      res.json({ 
        message: "Records merged successfully",
        primaryRecord: await storage.getCustomer(primaryId)
      });
    } catch (error) {
      console.error("Error merging duplicates:", error);
      res.status(500).json({ message: "Failed to merge duplicate records" });
    }
  });
  
  // Batch merge multiple duplicate groups at once
  app.post("/api/merge-duplicates/batch", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        groups: z.array(z.object({
          groupId: z.string(),
          primaryId: z.number(),
          recordIds: z.array(z.number())
        }))
      });
      
      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid request data" });
      }
      
      const { groups } = validationResult.data;
      const results = [];
      
      // Process all merge operations
      for (const group of groups) {
        const { primaryId, recordIds } = group;
        
        try {
          // Get primary record
          const primaryRecord = await storage.getCustomer(primaryId);
          if (!primaryRecord) {
            results.push({ 
              groupId: group.groupId, 
              success: false, 
              message: "Primary record not found" 
            });
            continue;
          }
          
          // Get secondary records to merge
          const secondaryIds = recordIds.filter(id => id !== primaryId);
          const secondaryRecords: Customer[] = [];
          
          for (const id of secondaryIds) {
            const record = await storage.getCustomer(id);
            if (record) {
              secondaryRecords.push(record);
            }
          }
          
          // Update primary record
          const mergedIds = secondaryRecords.map(r => r.customerId);
          await storage.updateCustomer(primaryId, {
            ...primaryRecord,
            isMerged: true,
            mergedFrom: [...(primaryRecord.mergedFrom || []), ...mergedIds],
            status: "merged"
          });
          
          // Delete or mark secondary records
          for (const record of secondaryRecords) {
            await storage.updateCustomer(record.id, {
              ...record,
              status: "merged_into",
              isMerged: true
            });
          }
          
          results.push({ 
            groupId: group.groupId, 
            success: true,
            primaryId
          });
        } catch (error) {
          console.error(`Error merging group ${group.groupId}:`, error);
          results.push({ 
            groupId: group.groupId, 
            success: false, 
            message: error instanceof Error ? error.message : "Unknown error" 
          });
        }
      }
      
      res.json({ 
        message: "Batch merge complete",
        totalProcessed: groups.length,
        successCount: results.filter(r => r.success).length,
        failureCount: results.filter(r => !r.success).length,
        results
      });
    } catch (error) {
      console.error("Error in batch merge:", error);
      res.status(500).json({ message: "Failed to process batch merge" });
    }
  });

  // Get dashboard analytics
  app.get("/api/analytics", async (_req: Request, res: Response) => {
    try {
      const totalCustomers = await storage.countCustomers();
      const duplicatesCount = await storage.countDuplicates();
      const fileHistory = await storage.getFileHistories();
      
      res.json({
        totalCustomers,
        duplicatesCount,
        recentFiles: fileHistory.slice(0, 5)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Generate PDF report for merged duplicates
  app.post("/api/reports/merge-pdf", async (req: Request, res: Response) => {
    try {
      // Validate the request body
      if (!req.body.mergedGroups || !Array.isArray(req.body.mergedGroups)) {
        return res.status(400).json({ message: "Invalid request body: mergedGroups is required" });
      }

      // Ensure each group has a primary record
      const validMergedGroups = req.body.mergedGroups.filter(
        (group: any) => group.primaryRecord && group.mergedRecords
      );

      if (validMergedGroups.length === 0) {
        return res.status(400).json({ message: "No valid merge groups found in request" });
      }

      // Prepare the data for the PDF generator with proper typing
      const reportData = {
        mergeDate: new Date(req.body.mergeDate || new Date()),
        mergedGroups: validMergedGroups,
        totalMerges: validMergedGroups.length,
      };

      // Generate the PDF report
      const pdfPath = generateMergeReport(reportData);
      
      // Return the path to the PDF file
      res.json({ 
        message: "PDF report generated successfully", 
        filePath: pdfPath,
        downloadUrl: `/api/download/reports/${path.basename(pdfPath)}`
      });
    } catch (error) {
      console.error("Error generating PDF report:", error);
      res.status(500).json({ message: "Failed to generate PDF report" });
    }
  });

  // Generate CSV file with ALL processed customer data (includes both merged and non-merged)
  app.get("/api/export/customers-csv", async (_req: Request, res: Response) => {
    try {
      // Get all customers
      const allCustomers = await storage.getCustomers();
      
      // Filter out customers that have been merged into other records (status = "merged_into")
      // Keep only primary merged customers and non-merged customers
      const consolidatedCustomers = allCustomers.filter(customer => {
        // Keep records if they are primary records (either with status "merged" or "clean")
        // Exclude any records that have been merged into other records ("merged_into")
        return customer.status !== "merged_into";
      });
      
      // Check if the filtering is working correctly
      const totalBefore = allCustomers.length;
      const totalAfter = consolidatedCustomers.length;
      const mergedIntoCount = allCustomers.filter(c => c.status === "merged_into").length;
      
      console.log(`CSV Export filtering: 
        - Total before: ${totalBefore}
        - Merged into others: ${mergedIntoCount} 
        - Total after filtering: ${totalAfter}
      `);
      
      console.log(`Export: Total customers: ${allCustomers.length}, Consolidated customers: ${consolidatedCustomers.length}`);
      
      // Generate CSV with ONLY the consolidated customers to ensure consistent counts
      // This ensures we don't need to do filtering twice
      const csvPath = generateMergedCsv(consolidatedCustomers);
      
      // Return the path to the CSV file - path should have the filtered count here
      res.json({ 
        message: "CSV file generated successfully",
        recordCount: totalAfter, // Use totalAfter which is the filtered count
        filePath: csvPath,
        downloadUrl: `/api/download/csv/${path.basename(csvPath)}`
      });
    } catch (error) {
      console.error("Error generating CSV file:", error);
      res.status(500).json({ message: "Failed to generate CSV file" });
    }
  });
  
  // Generate CSV file with ONLY unique customer data (excludes duplicates)
  app.get("/api/export/unique-customers-csv", async (_req: Request, res: Response) => {
    try {
      // Get all customers
      const allCustomers = await storage.getCustomers();
      
      // Filter to keep only clean records and primary merged records
      // This will exclude both merged_into records and secondary merged records
      const uniqueCustomers = allCustomers.filter(customer => {
        // For clean records, keep only those that haven't been marked as duplicates
        if (customer.status === "clean") {
          return true;
        }
        
        // For merged records, keep only those that are primary merged records
        if (customer.status === "merged" && customer.isMerged && customer.mergedFrom && customer.mergedFrom.length > 0) {
          return true;
        }
        
        return false;
      });
      
      console.log(`Unique CSV Export filtering: 
        - Total records: ${allCustomers.length}
        - Unique records: ${uniqueCustomers.length}
      `);
      
      // Generate CSV with ONLY the unique customers
      const csvPath = generateMergedCsv(uniqueCustomers);
      
      // Return the path to the CSV file
      res.json({ 
        message: "Unique customers CSV file generated successfully",
        recordCount: uniqueCustomers.length,
        filePath: csvPath,
        downloadUrl: `/api/download/csv/${path.basename(csvPath)}`
      });
    } catch (error) {
      console.error("Error generating unique customers CSV file:", error);
      res.status(500).json({ message: "Failed to generate unique customers CSV file" });
    }
  });

  // Download generated files (PDF reports and CSV files)
  app.get("/api/download/:type/:filename", (req: Request, res: Response) => {
    try {
      const { type, filename } = req.params;
      
      if (!['reports', 'csv'].includes(type)) {
        return res.status(400).json({ message: "Invalid file type" });
      }
      
      // Validate filename to prevent directory traversal
      if (filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({ message: "Invalid filename" });
      }
      
      const filePath = path.resolve(`./uploads/${type}/${filename}`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Set the appropriate content type
      const contentType = type === 'reports' ? 'application/pdf' : 'text/csv';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Stream the file to the client
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  return httpServer;
}
