# CS2 Trading Calculator

A comprehensive web application for tracking Counter-Strike 2 (CS2) skin trading performance with beautiful data visualizations and statistics.

## Features

### 🎯 Core Functionality
- **Trade Management**: Add, edit, and track CS2 skin trades
- **CSFloat Integration**: Import trades directly from CSFloat listings
- **Funds Tracking**: Monitor deposits, weekly drops, and other earnings
- **Statistics Dashboard**: Comprehensive performance analytics

### 📊 Data Visualization
- **Interactive Charts**: Built with Nivo (D3.js) for beautiful visualizations
- **Profit Over Time**: Track cumulative profit growth
- **Funds Distribution**: Pie chart showing funding sources
- **Monthly Analytics**: Bar charts for monthly profit overview
- **Performance Metrics**: Key trading statistics and averages

### 💰 Financial Tracking
- Total profit calculation
- Investment and revenue tracking
- Profit margin analysis
- Average sell time
- Average profit percentage
- Total inventory value

### 🎨 Modern UI/UX
- Dark theme with gradients and shadows
- Hover effects and smooth transitions
- Responsive Bento Grid layout
- Clean, professional design
- Mobile-friendly interface

## Technology Stack

- **Frontend**: React 19 with Hooks
- **Styling**: Tailwind CSS 4.x
- **Charts**: Nivo (D3.js based)
- **Forms**: React Hook Form
- **Data Tables**: React Data Table Component
- **HTTP Client**: Axios
- **Build Tool**: Vite 7.x
- **Deployment**: Ready for Vercel, Netlify, or GitHub Pages

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/MalteLindberg/trading.git
cd cs2-trading-calculator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment.

## Usage

### Adding Trades
1. **Manual Entry**: Input skin details, buy/sell prices, and dates manually
2. **CSFloat Import**: Use CSFloat listing IDs to automatically import trade data

### Tracking Funds
- **Weekly Drops**: Record sales from weekly case drops
- **Other Free Skins**: Track earnings from events, giveaways, etc.
- **Deposits**: Log both paid and free deposits

### Viewing Statistics
Navigate to the Stats tab to see:
- Total profit and performance metrics
- Interactive charts showing profit and funds over time
- Monthly profit breakdowns
- Comprehensive trading analytics

## API Integration

The app integrates with the CSFloat API to automatically fetch skin data. The API proxy is configured in `vite.config.js` for development.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Roadmap

- [ ] Export data to CSV/Excel
- [ ] Steam Market integration
- [ ] Portfolio optimization suggestions
- [ ] Mobile app version
- [ ] Advanced filtering and search
- [ ] Backup and sync functionality

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Built with ❤️ for the CS2 trading community
