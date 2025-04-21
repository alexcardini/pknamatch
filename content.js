// Create the sidebar element
const sidebar = document.createElement('div');
sidebar.id = 'kft-sidebar';
sidebar.innerHTML = `
  <div class="kft-sidebar-inner">
    <div class="kft-icon">
      <img src="https://asset.brandfetch.io/idue8J-eqc/id4qEfnEOh.png" alt="Konfront Logo">
    </div>
    <div class="kft-icons">
      <button class="kft-sidebar-toggle" data-label="AI Agents" data-description="AI Agents">
        <img src="https://i.ibb.co/PjfDYvV/Artificial-Intelligence-Spark-Streamline-Core-1.png" alt="AI agents">
      </button>
      <button class="kft-sidebar-toggle" data-label="Cyber Security" data-description="Cyber Security">
        <img src="https://i.ibb.co/NNWyKhw/Device-Database-Encryption-1-Streamline-Core-1.png" alt="Cyber security">
      </button>
      <button class="kft-sidebar-toggle" data-label="Developer Tools" data-description="Developer Tools">
        <img src="https://i.ibb.co/QQRBPZW/Code-Monitor-1-Streamline-Core-1.png" alt="Developer tools">
      </button>
      <button class="kft-sidebar-toggle" data-label="Social Tools" data-description="Social Tools">
        <img src="https://i.ibb.co/LJFxr1Q/Smiley-Cool-Streamline-Core-1.png" alt="Social tools">
      </button>
      <button class="kft-sidebar-toggle" data-label="Inspiration" data-description="Inspiration">
        <img src="https://i.ibb.co/rwPjqMn/Ai-Technology-Spark-Streamline-Core-1.png" alt="Inspiration">
      </button>
    </div>
    <button id="kft-sidebar-close" class="kft-sidebar-close hidden">
      <img src="https://i.ibb.co/NpJGtnX/Logout-1-Streamline-Core.png" alt="Close Sidebar">
    </button>
  </div>
  <div id="kft-sidebar-content">
    <iframe id="kft-sidebar-iframe" src="https://pg.konfront.mx"></iframe>
  </div>
`;

document.body.appendChild(sidebar);

// Add event listeners for toggling
const toggleButtons = document.querySelectorAll('.kft-sidebar-toggle');
const sidebarContent = document.getElementById('kft-sidebar-content');
const sidebarIframe = document.getElementById('kft-sidebar-iframe');
const closeButton = document.getElementById('kft-sidebar-close');
const kftSidebar = document.getElementById('kft-sidebar');

toggleButtons.forEach(button => {
  button.addEventListener('click', () => {
    const label = button.getAttribute('data-label');
    if (label === 'Developer Tools') {
      sidebarIframe.src = "https://pocbuildblocks.uwu.ai/";
    } else {
      sidebarIframe.src = "https://pg.konfront.mx"; // Default URL for other buttons
    }
    kftSidebar.classList.add('expanded');
    closeButton.classList.remove('hidden');
    document.body.classList.add('kft-sidebar-open');
    document.body.style.marginRight = '500px'; // Adjust the margin when the sidebar is expanded
  });

  button.addEventListener('mouseenter', () => {
    const description = button.getAttribute('data-description');
    const overlay = document.createElement('div');
    overlay.classList.add('icon-overlay');
    overlay.textContent = description;

    const rect = button.getBoundingClientRect();
    overlay.style.top = `${rect.top}px`;
    overlay.style.left = `${rect.left - overlay.offsetWidth - 3}px`; // Adjusted for sidebar position

    kftSidebar.appendChild(overlay);
  });

  button.addEventListener('mouseleave', () => {
    const overlay = kftSidebar.querySelector('.icon-overlay');
    if (overlay) overlay.remove();
  });
});

closeButton.addEventListener('click', () => {
  kftSidebar.classList.remove('expanded');
  closeButton.classList.add('hidden');
  document.body.classList.remove('kft-sidebar-open');
  document.body.style.marginRight = '60px'; // Reset the margin when the sidebar is collapsed
});

// Inject CSS for the sidebar
const style = document.createElement('style');
style.textContent = `
  body.kft-sidebar-open {
    margin-right: 500px; /* Push the body content to the left when sidebar is expanded */
  }
  #kft-sidebar {
    position: fixed;
    top: 0;
    right: 0;
    width: 60px; /* Initial collapsed width */
    height: 100%;
    background: #fff;
    color: white;
    z-index: 1000;
    box-shadow: -2px 0 5px rgba(0, 0, 0, 0.5);
    overflow-y: auto;
    transition: width 0.3s ease;
    border: 2px solid #013dce;
    border-radius: 10px 0 0 10px;
    display: flex;
    flex-direction: column;
  }
  #kft-sidebar.expanded {
    width: 500px; /* Expanded width */
  }
  .kft-sidebar-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 60px; /* Ensure the inner sidebar remains within 60px width */
    position: relative;
    flex-grow: 1;
    padding-top: 10px; /* Add some padding at the top */
  }
  .kft-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    margin-bottom: 20px; /* Add space below the logo */
  }
  .kft-icon img {
    width: 40px;
    height: 40px;
    border-radius: 5px;
  }
  .kft-icons {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%; /* Ensure the icons take full width */
  }
  .kft-icons button {
    background: none;
    border: none;
    margin: 10px 0;
    cursor: pointer;
    position: relative;
    z-index: 2; /* Ensure buttons are above the iframe */
    width: 45px; /* Ensure the buttons take full width */
    text-align: left; /* Align the icons to the left */
  }
  .kft-icons img {
    width: 30px;
    height: 30px;
  }
  #kft-sidebar-content {
    display: none;
    padding: 20px;
    box-sizing: border-box;
    width: 420px; /* Adjusted to fit within the expanded sidebar */
    height: 100%; /* Ensure the content height */
    position: absolute;
    top: 0; /* Align at the top */
    left: 80px; /* Add margin from the left side */
    background-color: #fff; /* Background color for the expanded content */
    z-index: 1; /* Ensure content is below the icons */
  }
  #kft-sidebar-iframe {
    width: calc(100% - 20px); /* Adjust iframe width to match the available space with an additional margin */
    height: 100%; /* Adjust iframe height to match the available space */
    border: none;
  }
  #kft-sidebar.expanded #kft-sidebar-content {
    display: block;
  }
  .kft-sidebar-close {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 40px;
    height: 40px;
    position: absolute;
    bottom: 20px;
    left: 10px;
    z-index: 2;
  }
  .kft-sidebar-close img {
    width: 30px;
    height: 30px;
  }
  .icon-overlay {
    position: fixed; /* Changed to fixed */
    background: rgba(1, 61, 206, 0.25);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    padding: 5px 10px;
    color: white;
    font-weight: bold;
    white-space: nowrap;
    z-index: 10000;
    transform: translateX(-100%); /* Position overlay to the left of the icons */
  }
  .hidden {
    display: none;
  }
`;

document.head.appendChild(style);

// Adjust the body margin to account for the initial sidebar width
document.body.style.marginRight = '60px';
