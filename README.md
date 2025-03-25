# PknaMatch: Intelligent Customer Data Deduplication Platform

Pknamatch is a powerful web-based application for identifying, cleaning, and consolidating duplicate customer records. Built with React, TypeScript, and Express, it provides sophisticated fuzzy matching algorithms that help businesses maintain clean customer databases.

![Pknamatch](https://img.shields.io/badge/CustomerMerge-Pro-2C5282)
![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

## 🌟 Features

- **Intelligent Duplicate Detection**: Uses multiple matching criteria including full name matching, phone number matching, and configurable fuzzy matching.
- **Intuitive Merge Interface**: Visual interface for reviewing and confirming potential duplicates.
- **Batch Processing**: Process hundreds or thousands of duplicate customer records with batch operations.
- **CSV Import/Export**: Easy data import from CSV files and export of clean, consolidated customer data.
- **PDF Reports**: Generate detailed PDF reports of all merge actions for record keeping and auditing.
- **Real-time Processing**: Watch the system process your data with visual progress indicators.
- **Data Cleanup**: Delete all data feature to start fresh when needed.

## 💻 Technology Stack

- **Frontend**: React, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Node.js, Express.js
- **Data Processing**: Custom fuzzy matching algorithms, string-similarity
- **Document Generation**: PDF generation for reporting
- **State Management**: React Query

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/customer-merge-pro.git
   cd customer-merge-pro
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5000`

## 📊 How It Works

1. **Import Data**: Upload your customer data CSV file through the drag-and-drop interface.
2. **Processing**: The system analyzes your data, identifying potential duplicates using multiple matching criteria.
3. **Review & Merge**: Review automatically detected duplicate groups and confirm which records to merge.
4. **Batch Processing**: Use batch operations to quickly process multiple duplicate groups.
5. **Export Clean Data**: Export your clean, deduplicated data as CSV or generate detailed PDF merge reports.

## 🔍 Matching Criteria

CustomerMerge Pro uses a sophisticated multi-criteria approach to identify potential duplicates:

- **Phone Number Matching**: Identical phone numbers are considered high-confidence duplicates.
- **Full Name Matching**: Combines first and last name for comprehensive matching.
- **Address Similarity**: Uses fuzzy matching to identify similar addresses.
- **Configurable Thresholds**: Adjust confidence thresholds to match your data quality needs.

## 📋 CSV Format

Your CSV file should contain the following columns (headers can be customized):

- First Name
- Last Name
- Phone
- Address
- Zone/Region (optional)
- Product (optional)
- Quantity (optional)
- Price (optional)
- Purchase Date (optional)

## 🧰 Advanced Features

- **Order History Consolidation**: Combines order histories from duplicate records into a unified customer profile.
- **Data Analytics**: View statistics on your customer data and deduplication results.
- **Confidence Scoring**: Each potential duplicate match is assigned a confidence score for easy prioritization.
- **Audit Trail**: Track all merges and system actions with detailed reporting.

## 🏆 Best Practices

- Always review high-confidence matches first.
- Use batch processing for datasets with many duplicates.
- Generate merge reports after significant deduplication operations.
- Regularly export your clean data.
- Use the "Delete All Data" feature when you want to start fresh with new data.

## 📚 Configuration Options

Various configuration options can be adjusted in the `.env` file:

```
PORT=5000
SIMILARITY_THRESHOLD=0.8
PHONE_MATCH_PRIORITY=HIGH
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Built with ❤️ for businesses that value clean customer data.
