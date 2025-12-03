# PowerShell script to install dependencies
Write-Host "🔧 Installing dependencies for Aixiv Insights..." -ForegroundColor Green

# Set execution policy for current process
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# Install dependencies
Write-Host "📦 Installing npm packages..." -ForegroundColor Yellow
npm install

# Install Tailwind CSS and related packages
Write-Host "🎨 Installing Tailwind CSS..." -ForegroundColor Yellow
npm install -D tailwindcss postcss autoprefixer

# Install Vite React plugin
Write-Host "⚛️  Installing Vite React plugin..." -ForegroundColor Yellow
npm install -D @vitejs/plugin-react @types/react @types/react-dom

# Initialize Tailwind CSS
Write-Host "⚙️  Initializing Tailwind CSS..." -ForegroundColor Yellow
npx tailwindcss init -p

Write-Host "✅ All dependencies installed successfully!" -ForegroundColor Green
Write-Host "🚀 You can now run: npm run dev" -ForegroundColor Cyan
