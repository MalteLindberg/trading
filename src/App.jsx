import { useState, useEffect } from 'react';
import './App.css';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import csgoSkins from './csgoSkins.json';

// Autocomplete Component
const SkinAutocomplete = ({ value, onChange, onSelect, placeholder, className, register, name, error }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);

  // Create formatted skin names from the JSON data
  const skinNames = csgoSkins.map(item => `${item.weapon} | ${item.skin}`);

  const handleInputChange = (e) => {
    const userInput = e.target.value;
    onChange(e);

    if (userInput.length > 1) {
      const filteredSuggestions = skinNames.filter(skin =>
        skin.toLowerCase().includes(userInput.toLowerCase())
      ).slice(0, 30); // Limit to 15 suggestions

      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
      setActiveSuggestion(0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    onSelect(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion(prev => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showSuggestions && suggestions[activeSuggestion]) {
        handleSuggestionClick(suggestions[activeSuggestion]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <input
        {...register(name, { required: true })}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        onFocus={() => value.length > 1 && setShowSuggestions(true)}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-[#1B1D24] border border-gray-600 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              className={`px-4 py-2 cursor-pointer text-sm hover:bg-[#2E323E] ${
                index === activeSuggestion ? 'bg-[#2E323E] text-white' : 'text-gray-300'
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-red-500 text-sm mt-1">Skin name is required</p>}
    </div>
  );
};

export default function App() {
  const [open, setOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [actualSellPrice, setActualSellPrice] = useState("");
  const today = new Date().toISOString().split('T')[0];
  const [sellDate, setSellDate] = useState(today);
  const closeModal = () => setOpen(false);
  const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false);
  const closeDeleteConfirmation = () => setOpenDeleteConfirmation(false);
  
  // History popup functions
  const openHistoryPopup = (type) => {
    console.log("Opening history popup for type:", type);
    console.log("Added funds data:", addedFunds);
    setHistoryType(type);
    const filteredData = Array.isArray(addedFunds) ? addedFunds.filter(fund => fund.source === type) : [];
    setHistoryData(filteredData);
    setHistoryPopupOpen(true);
  };
  
  const closeHistoryPopup = () => {
    setHistoryPopupOpen(false);
    setHistoryType("");
    setHistoryData([]);
  };
  const [selectedUnsold, setSelectedUnsold] = useState([]);
  const [selectedSold, setSelectedSold] = useState([]);
  const [skinName, setSkinName] = useState("");
  const [activeTab, setActiveTab] = useState("csfloat"); // "manual" or "csfloat"
  const [popupActiveTab, setPopupActiveTab] = useState("markAsSold"); // "markAsSold", "changeInfo", "viewInfo"
  const [csfloatId, setCsfloatId] = useState("");
  const [csfloatLoading, setCsfloatLoading] = useState(false);
  const [csfloatExpectedPrice, setCsfloatExpectedPrice] = useState("");
  const [csfloatBuyDate, setCsfloatBuyDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Add Funds states
  const [addFundsTab, setAddFundsTab] = useState("weeklyDrop"); // "weeklyDrop", "otherFreeSkins", or "deposit"
  const [weeklyDropCsfloatId, setWeeklyDropCsfloatId] = useState("");
  const [weeklyDropLoading, setWeeklyDropLoading] = useState(false);
  const [otherFreeCsfloatId, setOtherFreeCsfloatId] = useState("");
  const [otherFreeLoading, setOtherFreeLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositFree, setDepositFree] = useState(false);
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [addFundsResult, setAddFundsResult] = useState("");

  // History popup states
  const [historyPopupOpen, setHistoryPopupOpen] = useState(false);
  const [historyType, setHistoryType] = useState(""); // "weeklyDrop" or "otherFree"
  const [historyData, setHistoryData] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm();
  const [result, setResult] = useState("");
  const [activeView, setActiveView] = useState("newItem");

  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedFunds, setAddedFunds] = useState([]);
  const [fundsLoading, setFundsLoading] = useState(true);

  // Fetch trades
  const fetchTrades = () => {
    setLoading(true);
    axios.get("https://j0ipzxie44.execute-api.eu-north-1.amazonaws.com/trades")
      .then(res => setTrades(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  // Fetch added funds
  const fetchAddedFunds = () => {
    setFundsLoading(true);
    axios.get("https://j0ipzxie44.execute-api.eu-north-1.amazonaws.com/add_funds")
      .then(res => setAddedFunds(res.data))
      .catch(console.error)
      .finally(() => setFundsLoading(false));
  };

  useEffect(() => {
    fetchTrades();
    fetchAddedFunds();
    setValue("itemType", "Normal"); // Set default item type
  }, [setValue]);

  useEffect(() => {
    if (activeView === "database") {
      fetchTrades();
    } else if (activeView === "stats") {
      fetchTrades();
      fetchAddedFunds();
    }
  }, [activeView]);

  const columns = [
    { 
      name: 'Skin', 
      selector: row => row.skinName, 
      sortable: true,
      width: '35%',
      cell: row => (
        <div style={{ 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          maxWidth: '100%'
        }}>
          {row.skinName}
        </div>
      )
    },
    { 
      name: 'Date', 
      selector: row => row.buyDate, 
      sortable: true,
      width: '75px',
      format: row => row.buyDate.slice(5) // Show MM-DD format
    },
    { 
      name: 'Buy', 
      selector: row => row.buyPrice, 
      sortable: true, 
      right: true,
      width: '70px',
      format: row => `$${row.buyPrice}`
    },
    { 
      name: 'Expected', 
      selector: row => row.expectedSellPrice, 
      sortable: true, 
      right: true,
      width: '80px',
      format: row => `$${row.expectedSellPrice}`
    },
    { 
      name: 'Profit', 
      selector: row => row.expectedProfitDollar, 
      sortable: true, 
      right: true,
      width: '90px',
      cell: row => (
        <div style={{ 
          color: row.expectedProfitDollar > 0 ? '#10B981' : row.expectedProfitDollar < 0 ? '#EF4444' : '#6B7280',
          fontSize: '11px',
          lineHeight: '1.2',
          textAlign: 'right',
          width: '100%'
        }}>
          <div>${row.expectedProfitDollar}</div>
          <div>({row.expectedProfitPercent}%)</div>
        </div>
      )
    },
  ];
  const columnsSold = [
    { 
      name: 'Skin', 
      selector: row => row.skinName, 
      sortable: true,
      width: '35%',
      cell: row => (
        <div style={{ 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          maxWidth: '100%'
        }}>
          {row.skinName}
        </div>
      )
    },
    { 
      name: 'Date', 
      selector: row => row.sellDate, 
      sortable: true,
      width: '75px',
      format: row => row.sellDate.slice(5) // Show MM-DD format
    },
    { 
      name: 'Buy', 
      selector: row => row.buyPrice, 
      sortable: true, 
      right: true,
      width: '70px',
      format: row => `$${row.buyPrice}`
    },
    { 
      name: 'Sell', 
      selector: row => row.actualSellPrice, 
      sortable: true, 
      right: true,
      width: '70px',
      format: row => `$${row.actualSellPrice}`
    },
    { 
      name: 'Profit', 
      selector: row => row.actualProfitDollar, 
      sortable: true, 
      right: true,
      width: '90px',
      cell: row => (
        <div style={{ 
          color: row.actualProfitDollar > 0 ? '#10B981' : row.actualProfitDollar < 0 ? '#EF4444' : '#6B7280',
          fontSize: '11px',
          lineHeight: '1.2',
          textAlign: 'right',
          width: '100%'
        }}>
          <div>${row.actualProfitDollar}</div>
          <div>({row.actualProfitPercent}%)</div>
        </div>
      )
    },
  ];

  const [filterText, setFilterText] = useState("");

  const filtered = trades.filter(
    t =>
      t.skinName.toLowerCase().includes(filterText.toLowerCase()) ||
      t.buyDate.toLowerCase().includes(filterText.toLowerCase())
  );

  const unsoldTrades = filtered.filter(t => !t.sellStatus);
  const soldTrades = filtered.filter(t => t.sellStatus);

  // Statistics calculations
  const calculateStatistics = () => {
    // Trading Statistics
    const totalProfit = soldTrades.reduce((sum, trade) => sum + (parseFloat(trade.actualProfitDollar) || 0), 0);
    const totalInvestment = soldTrades.reduce((sum, trade) => sum + (parseFloat(trade.buyPrice) || 0), 0);
    const totalRevenue = soldTrades.reduce((sum, trade) => sum + (parseFloat(trade.actualSellPrice) || 0), 0);
    const profitMargin = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
    
    // Funds Statistics - Add safety checks
    const weeklyDropEarnings = Array.isArray(addedFunds) ? addedFunds
      .filter(fund => fund && fund.source === "weekly_drop")
      .reduce((sum, fund) => sum + (parseFloat(fund.amount) || 0), 0) : 0;
    
    const otherFreeEarnings = Array.isArray(addedFunds) ? addedFunds
      .filter(fund => fund && fund.source === "other_free_skin")
      .reduce((sum, fund) => sum + (parseFloat(fund.amount) || 0), 0) : 0;

    const totalFreeEarnings = weeklyDropEarnings + otherFreeEarnings;
    
    const paidDeposits = Array.isArray(addedFunds) ? addedFunds
      .filter(fund => fund && fund.source === "paid_deposit")
      .reduce((sum, fund) => sum + (parseFloat(fund.amount) || 0), 0) : 0;
    
    const freeDeposits = Array.isArray(addedFunds) ? addedFunds
      .filter(fund => fund && fund.source === "free_deposit")
      .reduce((sum, fund) => sum + (parseFloat(fund.amount) || 0), 0) : 0;
    
    const totalDeposits = paidDeposits + freeDeposits;
    const totalFundsAdded = totalFreeEarnings + totalDeposits;
    
    // Calculate average sell time (only for sold items)
    const avgSellTime = Array.isArray(soldTrades) && soldTrades.length > 0 ? 
      soldTrades.reduce((sum, trade) => {
        const buyDate = new Date(trade.buyDate);
        const sellDate = new Date(trade.sellDate);
        const daysDiff = Math.floor((sellDate - buyDate) / (1000 * 60 * 60 * 24));
        return sum + daysDiff;
      }, 0) / soldTrades.length : 0;
    
    // Calculate total inventory value (total funds added + total profit)
    const totalInventoryValue = totalFundsAdded + totalProfit;
    
    // Calculate average profit percentage (only for sold items)
    const avgProfitPercent = Array.isArray(soldTrades) && soldTrades.length > 0 ? 
      soldTrades.reduce((sum, trade) => sum + (parseFloat(trade.actualProfitPercent) || 0), 0) / soldTrades.length : 0;
    
    // Profit over time data
    const profitOverTime = Array.isArray(soldTrades) ? soldTrades
      .sort((a, b) => new Date(a.sellDate) - new Date(b.sellDate))
      .reduce((acc, trade) => {
        const date = trade.sellDate;
        const lastProfit = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
        acc.push({
          date,
          profit: parseFloat(trade.actualProfitDollar) || 0,
          cumulative: lastProfit + (parseFloat(trade.actualProfitDollar) || 0)
        });
        return acc;
      }, []) : [];
    
    // Funds over time data
    const fundsOverTime = Array.isArray(addedFunds) ? addedFunds
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .reduce((acc, fund) => {
        const date = fund.date;
        const lastTotal = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
        acc.push({
          date,
          amount: parseFloat(fund.amount) || 0,
          cumulative: lastTotal + (parseFloat(fund.amount) || 0),
          source: fund.source
        });
        return acc;
      }, []) : [];
    
    return {
      totalProfit: parseFloat(totalProfit.toFixed(2)) || 0,
      totalInvestment: parseFloat(totalInvestment.toFixed(2)) || 0,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)) || 0,
      profitMargin: parseFloat(profitMargin.toFixed(2)) || 0,
      weeklyDropEarnings: parseFloat(weeklyDropEarnings.toFixed(2)) || 0,
      otherFreeEarnings: parseFloat(otherFreeEarnings.toFixed(2)) || 0,
      totalFreeEarnings: parseFloat(totalFreeEarnings.toFixed(2)) || 0,
      paidDeposits: parseFloat(paidDeposits.toFixed(2)) || 0,
      freeDeposits: parseFloat(freeDeposits.toFixed(2)) || 0,
      totalDeposits: parseFloat(totalDeposits.toFixed(2)) || 0,
      totalFundsAdded: parseFloat(totalFundsAdded.toFixed(2)) || 0,
      avgSellTime: parseFloat(avgSellTime.toFixed(1)) || 0,
      avgProfitPercent: parseFloat(avgProfitPercent.toFixed(2)) || 0,
      totalInventoryValue: parseFloat(totalInventoryValue.toFixed(2)) || 0,
      profitOverTime,
      fundsOverTime,
      totalTrades: Array.isArray(trades) ? trades.length : 0,
      soldTradesCount: Array.isArray(soldTrades) ? soldTrades.length : 0,
      unsoldTradesCount: Array.isArray(unsoldTrades) ? unsoldTrades.length : 0
    };
  };

  const stats = calculateStatistics();

  // Chart data preparation functions
  const prepareProfitOverTimeData = () => {
    if (!Array.isArray(stats.profitOverTime) || stats.profitOverTime.length === 0) {
      return [{
        id: "Total Profit",
        data: [{ x: "No data", y: 0 }]
      }];
    }

    // Start with 0 and build cumulative profit over time
    const dataPoints = [{ x: "Start", y: 0 }]; // Starting point at 0
    
    stats.profitOverTime.forEach(point => {
      dataPoints.push({
        x: point.date,
        y: point.cumulative
      });
    });

    return [{
      id: "Total Profit",
      data: dataPoints
    }];
  };

  const prepareFundsOverTimeData = () => {
    if (!Array.isArray(stats.fundsOverTime) || stats.fundsOverTime.length === 0) {
      return [{
        id: "Total Funds",
        data: [{ x: "No data", y: 0 }]
      }];
    }

    // Show total accumulated funds over time (single line)
    const dataPoints = [{ x: "Start", y: 0 }]; // Starting point at 0
    
    stats.fundsOverTime.forEach(point => {
      dataPoints.push({
        x: point.date,
        y: point.cumulative
      });
    });

    return [{
      id: "Total Funds",
      data: dataPoints
    }];
  };

  const prepareFundsDistributionData = () => {
    const data = [];
    
    if (stats.weeklyDropEarnings > 0) {
      data.push({
        id: "Weekly Drops",
        label: "Weekly Drops",
        value: stats.weeklyDropEarnings,
        color: "#10B981" // green
      });
    }
    
    if (stats.otherFreeEarnings > 0) {
      data.push({
        id: "Other Free",
        label: "Other Free",
        value: stats.otherFreeEarnings,
        color: "#8B5CF6" // purple
      });
    }
    
    if (stats.paidDeposits > 0) {
      data.push({
        id: "Paid Deposits",
        label: "Paid Deposits", 
        value: stats.paidDeposits,
        color: "#F59E0B" // orange
      });
    }
    
    if (stats.freeDeposits > 0) {
      data.push({
        id: "Free Deposits",
        label: "Free Deposits",
        value: stats.freeDeposits,
        color: "#3B82F6" // blue
      });
    }

    return data;
  };

  const prepareMonthlyProfitData = () => {
    if (!Array.isArray(stats.profitOverTime) || stats.profitOverTime.length === 0) {
      return [];
    }

    // Group profits by month
    const monthlyData = stats.profitOverTime.reduce((acc, point) => {
      const date = new Date(point.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          profit: 0
        };
      }
      
      acc[monthKey].profit += point.profit;
      
      return acc;
    }, {});

    return Object.values(monthlyData).map(item => ({
      month: item.month,
      profit: parseFloat(item.profit.toFixed(2))
    }));
  };



  const fetchCsfloatItem = async (listingId) => {
    setCsfloatLoading(true);
    try {
      // Use proxy in development, different CORS proxy in production
      const apiUrl = import.meta.env.DEV 
        ? `/api/csfloat/listings/${listingId}`
        : `https://corsproxy.io/?${encodeURIComponent(`https://csfloat.com/api/v1/listings/${listingId}`)}`;
      
      const response = await axios.get(apiUrl);
      
      // Parse response - corsproxy.io returns data directly
      const item = response.data;
      console.log("CSFloat item data:", item);
      
      // Map condition values to abbreviations
      const conditionAbbrevMap = {
        0: "FN",
        1: "MW",
        2: "FT", 
        3: "WW",
        4: "BS"
      };
      
      // Determine item type
      let itemType = "Normal";
      if (item.item.is_stattrak) itemType = "StatTrak™";
      if (item.item.is_souvenir) itemType = "Souvenir";
      
      // Format skin name
      const formattedSkinName = `${item.item.item_name}`;
      
      // Convert price from cents to dollars
      const priceInDollars = parseFloat(item.price) / 100;
      
      // Check if item is sold and get sell date (this is when someone sold it to you)
      let buyDate = csfloatBuyDate || new Date().toISOString().split('T')[0]; // Default to user input or today
      
      if (item.state === "sold" && item.sold_at) {
        // For sold items, use the sold_at date as your buy date (when you purchased it)
        const soldAtDate = new Date(item.sold_at);
        buyDate = soldAtDate.toISOString().split('T')[0];
      }
      
      // Create payload for database (all CSFloat imports are purchases, so sellStatus is always false)
      const payload = {
        skinName: formattedSkinName,
        buyPrice: priceInDollars,
        expectedSellPrice: parseFloat(csfloatExpectedPrice) || priceInDollars, // Use user input or fall back to buy price
        sellStatus: false, // Always false for CSFloat imports - you'll update this later when you actually sell
        buyDate: buyDate,
        expectedProfitDollar: 0,
        expectedProfitPercent: 0,
        floatValue: item.item.float_value,
        condition: item.item.wear_name,
        itemType: itemType,
        stickers: item.item.stickers || [],
        inspectLink: item.item.inspect_link || ""
      };
      
      // Calculate profit based on expected sell price
      const profitBuyPrice = priceInDollars;
      const profitExpectedSellPrice = parseFloat(csfloatExpectedPrice) || priceInDollars;
      const netSellPrice = profitExpectedSellPrice * 0.98; // After 2% fee
      const profitDollar = netSellPrice - profitBuyPrice;
      const profitPercent = (profitDollar / profitBuyPrice) * 100;
      
      payload.expectedProfitDollar = parseFloat(profitDollar.toFixed(2));
      payload.expectedProfitPercent = parseFloat(profitPercent.toFixed(2));
      
      // Submit to database
      const dbResponse = await axios.post("https://j0ipzxie44.execute-api.eu-north-1.amazonaws.com/trades", payload);
      setResult("CSFloat item added successfully!");
      fetchTrades();
      setCsfloatId("");
      setCsfloatExpectedPrice("");
      
    } catch (err) {
      console.error(err);
      setResult("Error fetching CSFloat item. Please check the listing ID.");
    } finally {
      setCsfloatLoading(false);
    }
  };

  const fetchWeeklyDropItem = async (listingId) => {
    setWeeklyDropLoading(true);
    try {
      // Use proxy in development, different CORS proxy in production
      const apiUrl = import.meta.env.DEV 
        ? `/api/csfloat/listings/${listingId}`
        : `https://corsproxy.io/?${encodeURIComponent(`https://csfloat.com/api/v1/listings/${listingId}`)}`;
      
      const response = await axios.get(apiUrl);
      
      // Parse response - corsproxy.io returns data directly
      const item = response.data;
      console.log("Weekly drop CSFloat item data:", item);
      
      // Convert price from cents to dollars - this is the amount you received
      const priceInDollars = parseFloat(item.price) / 100;
      const netSellPrice = Math.floor(priceInDollars * 0.98 * 100) / 100; // After 2% fee, rounded down to 2 decimals
      
      // Get sell date (when you sold the weekly drop)
      let weeklyDropSellDate = new Date().toISOString().split('T')[0]; // Default to today
      
      if (item.state === "sold" && item.sold_at) {
        const soldAtDate = new Date(item.sold_at);
        weeklyDropSellDate = soldAtDate.toISOString().split('T')[0];
      }
      
      // Format skin name
      const formattedSkinName = `${item.item.item_name}`;
      
      // Create payload for added-funds database
      const payload = {
        amount: netSellPrice,
        source: "weekly_drop",
        date: weeklyDropSellDate,
        skinName: formattedSkinName,
        csfloatId: listingId
      };
      
      const dbResponse = await axios.post("https://j0ipzxie44.execute-api.eu-north-1.amazonaws.com/add_funds", payload);
      
      setAddFundsResult(`Weekly drop sale added successfully! Received $${netSellPrice} from ${formattedSkinName}`);
      setWeeklyDropCsfloatId("");
      
    } catch (err) {
      console.error(err);
      setAddFundsResult("Error fetching weekly drop item. Please check the listing ID.");
    } finally {
      setWeeklyDropLoading(false);
    }
  };

  const fetchOtherFreeSkinItem = async (listingId) => {
    setOtherFreeLoading(true);
    try {
      // Use proxy in development, different CORS proxy in production
      const apiUrl = import.meta.env.DEV 
        ? `/api/csfloat/listings/${listingId}`
        : `https://corsproxy.io/?${encodeURIComponent(`https://csfloat.com/api/v1/listings/${listingId}`)}`;
      
      const response = await axios.get(apiUrl);
      
      // Parse response - corsproxy.io returns data directly
      const item = response.data;
      console.log("Other free skin CSFloat item data:", item);
      
      // Convert price from cents to dollars - this is the amount you received
      const priceInDollars = parseFloat(item.price) / 100;
      const netSellPrice = Math.floor(priceInDollars * 0.98 * 100) / 100; // After 2% fee, rounded down to 2 decimals
      
      // Get sell date (when you sold the other free skin)
      let freeSkinSellDate = new Date().toISOString().split('T')[0]; // Default to today
      
      if (item.state === "sold" && item.sold_at) {
        const soldAtDate = new Date(item.sold_at);
        freeSkinSellDate = soldAtDate.toISOString().split('T')[0];
      }
      
      // Format skin name
      const formattedSkinName = `${item.item.item_name}`;
      
      // Create payload for added-funds database
      const payload = {
        amount: netSellPrice,
        source: "other_free_skin",
        date: freeSkinSellDate,
        skinName: formattedSkinName,
        csfloatId: listingId
      };
      
      const dbResponse = await axios.post("https://j0ipzxie44.execute-api.eu-north-1.amazonaws.com/add_funds", payload);
      
      setAddFundsResult(`Other free skin sale added successfully! Received $${netSellPrice} from ${formattedSkinName}`);
      setOtherFreeCsfloatId("");
      
    } catch (err) {
      console.error(err);
      setAddFundsResult("Error fetching other free skin item. Please check the listing ID.");
    } finally {
      setOtherFreeLoading(false);
    }
  };

  const submitDeposit = async () => {
    if (!depositAmount) {
      setAddFundsResult("Please enter a deposit amount.");
      return;
    }

    try {
      const payload = {
        amount: parseFloat(depositAmount),
        source: depositFree ? "free_deposit" : "paid_deposit",
        date: depositDate,
        isFree: depositFree
      };
      
      const dbResponse = await axios.post("https://j0ipzxie44.execute-api.eu-north-1.amazonaws.com/add_funds", payload);
      
      const depositType = depositFree ? "free deposit" : "paid deposit";
      setAddFundsResult(`${depositType} of $${depositAmount} added successfully!`);
      setDepositAmount("");
      setDepositFree(false);
      setDepositDate(new Date().toISOString().split('T')[0]);
      
    } catch (err) {
      console.error(err);
      setAddFundsResult("Error submitting deposit.");
    }
  };

  const onSubmit = async (data) => {
    const buyDate = data.buyDate ? new Date(data.buyDate) : new Date();

    const profitBuyPrice = parseFloat(data.buyPrice);
    const profitExpectedSellPrice = parseFloat(data.expectedSellPrice);
    const netSellPrice = profitExpectedSellPrice * 0.98; // After 2% fee
    const profitDollar = netSellPrice - profitBuyPrice;
    const profitPercent = (profitDollar / profitBuyPrice) * 100;

    const payload = {
      skinName: skinName,
      buyPrice: parseFloat(data.buyPrice),
      expectedSellPrice: parseFloat(data.expectedSellPrice),
      sellStatus: false,
      buyDate: buyDate.toISOString().split('T')[0], // Format to YYYY-MM-DD
      expectedProfitDollar: parseFloat(profitDollar.toFixed(2)),
      expectedProfitPercent: parseFloat(profitPercent.toFixed(2))
    };

    try {
      const response = await axios.post("https://j0ipzxie44.execute-api.eu-north-1.amazonaws.com/trades", payload);
      setResult("Item added successfully!");
      fetchTrades();
      reset();
      setSkinName(""); // Reset skin name
      setValue("itemType", "Normal"); // Reset item type to default
    } catch (err) {
      console.error(err);
      setResult("Error submitting item.");
    }
  };

  const deleteSelectedItems = async () => {
    if (selectedUnsold.length > 0) {
      const confirmDelete = window.confirm(`Delete ${selectedUnsold.length} selected item(s)?`);
      if (!confirmDelete) return;

      try {
        await Promise.all(
          selectedUnsold.map(item =>
            axios.delete("https://j0ipzxie44.execute-api.eu-north-1.amazonaws.com/trades", {
              data: { index: item.index }
            })
          )
        );
        setSelectedUnsold([]); // Clear selection
        fetchTrades(); // Refresh data
      } catch (err) {
        console.error(err);
        alert("Failed to delete some or all selected items.");
      }
    }
    else if (selectedSold.length > 0) {
      const confirmDelete = window.confirm(`Delete ${selectedSold.length} selected item(s)?`);
      if (!confirmDelete) return;
      try {
        await Promise.all(
          selectedSold.map(item =>
            axios.delete("https://j0ipzxie44.execute-api.eu-north-1.amazonaws.com/trades", {
              data: { index: item.index }
            })
          )
        );
        setSelectedSold([]); // Clear selection
        fetchTrades(); // Refresh data
      } catch (err) {
        console.error(err);
        alert("Failed to delete some or all selected items.");
      }
    }
    else return;
  };

  return (
    <div className="mainContainer min-h-screen w-full bg-[#15171C] flex flex-col gap-20">
      <Popup nested open={open} closeOnDocumentClick onClose={closeModal}>
          <div className='p-6 flex flex-col bg-[#1B1D24] shadow-lg text-center items-center gap-4 rounded-lg min-w-[500px]'>
            <p className='text-2xl font-extrabold text-white'>{selectedTrade?.skinName}</p>
            
            {/* Tab Navigation */}
            <div className="flex mb-4 bg-[#2E323E] rounded-lg p-1 w-full">
              {(!selectedTrade?.sellStatus) && (
                <button
                  type="button"
                  onClick={() => setPopupActiveTab("markAsSold")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                    popupActiveTab === "markAsSold"
                      ? "bg-[#1B1D24] text-white"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  Mark as Sold
                </button>
              )}
              <button
                type="button"
                onClick={() => setPopupActiveTab("changeInfo")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                  popupActiveTab === "changeInfo"
                    ? "bg-[#1B1D24] text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Change Information
              </button>
              <button
                type="button"
                onClick={() => setPopupActiveTab("viewInfo")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                  popupActiveTab === "viewInfo"
                    ? "bg-[#1B1D24] text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                View Information
              </button>
            </div>

            {/* Mark as Sold Tab */}
            {popupActiveTab === "markAsSold" && !selectedTrade?.sellStatus && (
              <div className="w-full">
                <div className='flex flex-row gap-4 mb-4 text-gray-300'>
                  <p className='text-lg font-bold'>Buy Price: <span className='font-normal'>${selectedTrade?.buyPrice}</span></p>
                  <p className='text-lg font-bold'>Expected Sell Price: <span className='font-normal'>${selectedTrade?.expectedSellPrice}</span></p>
                </div>
                <div className="mb-4">
                  <label className="block mb-2 font-medium text-gray-300">Actual Sell Price:</label>
                  <input
                    type="number"
                    value={actualSellPrice}
                    onChange={(e) => setActualSellPrice(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-[#2E323E] text-white border-gray-600"
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2 font-medium text-gray-300">Sell Date:</label>
                  <input
                    type="date"
                    value={sellDate || ""}
                    onChange={(e) => setSellDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-[#2E323E] text-white border-gray-600"
                  />
                </div>
                <div className='flex flex-row gap-4 justify-center'>
                  <button
                    onClick={async () => {
                      try {
                        await axios.put("https://j0ipzxie44.execute-api.eu-north-1.amazonaws.com/trades", {
                          index: selectedTrade.index,
                          actualSellPrice: parseFloat(actualSellPrice),
                          buyPrice: selectedTrade.buyPrice,
                          sellDate: (sellDate || new Date().toISOString()).split('T')[0]
                        });
                        fetchTrades();
                        closeModal();
                      } catch (err) {
                        console.error(err);
                        alert("Failed to update trade.");
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition"
                  >
                    Confirm Sale
                  </button>
                  <button
                    onClick={() => setOpenDeleteConfirmation(true)}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition"
                  >
                    Delete Item
                  </button>
                </div>
              </div>
            )}

            {/* Change Information Tab */}
            {popupActiveTab === "changeInfo" && (
              <div className="w-full">
                <p className="text-gray-300 mb-4">Change information functionality will be implemented here.</p>
                <div className="flex justify-center">
                  <button
                    onClick={() => setOpenDeleteConfirmation(true)}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition"
                  >
                    Delete Item
                  </button>
                </div>
              </div>
            )}

            {/* View Information Tab */}
            {popupActiveTab === "viewInfo" && (
              <div className="w-full text-left">
                <div className="grid grid-cols-2 gap-4 text-gray-300">
                  <div>
                    <p className="font-bold">Buy Price:</p>
                    <p className="text-white">${selectedTrade?.buyPrice}</p>
                  </div>
                  <div>
                    <p className="font-bold">Buy Date:</p>
                    <p className="text-white">{selectedTrade?.buyDate}</p>
                  </div>
                  {selectedTrade?.sellStatus ? (
                    <>
                      <div>
                        <p className="font-bold">Sell Price:</p>
                        <p className="text-white">${selectedTrade?.actualSellPrice}</p>
                      </div>
                      <div>
                        <p className="font-bold">Sell Date:</p>
                        <p className="text-white">{selectedTrade?.sellDate}</p>
                      </div>
                      <div>
                        <p className="font-bold">Actual Profit:</p>
                        <p className={`font-bold ${selectedTrade?.actualProfitDollar > 0 ? 'text-green-400' : selectedTrade?.actualProfitDollar < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          ${selectedTrade?.actualProfitDollar} ({selectedTrade?.actualProfitPercent}%)
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="font-bold">Expected Sell Price:</p>
                        <p className="text-white">${selectedTrade?.expectedSellPrice}</p>
                      </div>
                      <div>
                        <p className="font-bold">Expected Profit:</p>
                        <p className={`font-bold ${selectedTrade?.expectedProfitDollar > 0 ? 'text-green-400' : selectedTrade?.expectedProfitDollar < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          ${selectedTrade?.expectedProfitDollar} ({selectedTrade?.expectedProfitPercent}%)
                        </p>
                      </div>
                    </>
                  )}
                  {selectedTrade?.floatValue && (
                    <div>
                      <p className="font-bold">Float Value:</p>
                      <p className="text-white">{selectedTrade?.floatValue}</p>
                    </div>
                  )}
                  {selectedTrade?.condition && (
                    <div>
                      <p className="font-bold">Condition:</p>
                      <p className="text-white">{selectedTrade?.condition}</p>
                    </div>
                  )}
                </div>
                {!selectedTrade?.sellStatus && (
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={() => setOpenDeleteConfirmation(true)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition"
                    >
                      Delete Item
                    </button>
                  </div>
                )}
              </div>
            )}
             
            <Popup nested open={openDeleteConfirmation} closeOnDocumentClick onClose={closeDeleteConfirmation}>
              <div className='p-6 flex flex-col bg-[#1B1D24] shadow-lg text-center items-center gap-4 rounded-lg'>
                <p className='text-2xl font-extrabold text-white'>Are you sure you want to delete this trade?</p>
                <p className='text-lg font-bold text-gray-300'>Skin: {selectedTrade?.skinName}</p>
                <div className='flex flex-row gap-4'>
                  <button
                    onClick={async () => {
                      try {
                        await axios.delete("https://j0ipzxie44.execute-api.eu-north-1.amazonaws.com/trades", {
                          data: { index: selectedTrade.index }
                        });
                        fetchTrades();
                        closeDeleteConfirmation();
                        closeModal();
                      } catch (err) {
                        console.error(err);
                        alert("Failed to delete trade.");
                      }
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={closeDeleteConfirmation}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Popup>
          </div>
      </Popup>
      <nav className="flex justify-center">
        <div className="inline-flex gap-3 bg-[#1B1D24] py-4 px-12 rounded-b-lg">
          <button 
            onClick={() => setActiveView("database")} 
            className={`font-bold py-2 px-4 rounded-lg cursor-pointer transition
              ${activeView === "database" 
                ? "bg-[#2E323E] text-white" 
                : "text-gray-300 hover:bg-[#2E323E] hover:text-white"
              }`}
          >
            TRADE DATABASE
          </button>
          <button 
            onClick={() => setActiveView("stats")} 
            className={`font-bold py-2 px-4 rounded-lg cursor-pointer transition
              ${activeView === "stats" 
                ? "bg-[#2E323E] text-white" 
                : "text-gray-300 hover:bg-[#2E323E] hover:text-white"
              }`}
          >
            STATS
          </button>
          <button 
            onClick={() => setActiveView("newItem")} 
            className={`font-bold py-2 px-4 rounded-lg cursor-pointer transition
              ${activeView === "newItem" 
                ? "bg-[#2E323E] text-white" 
                : "text-gray-300 hover:bg-[#2E323E] hover:text-white"
              }`}
          >
            NEW ITEM
          </button>
          <button
            onClick={() => setActiveView("addFunds")}
            className={`font-bold py-2 px-4 rounded-lg cursor-pointer transition
              ${activeView === "addFunds"
                ? "bg-[#2E323E] text-white"
                : "text-gray-300 hover:bg-[#2E323E] hover:text-white"
              }`}
          >
            ADD FUNDS
          </button>
        </div>
      </nav>

      <div className="flex justify-center">
        {activeView === "newItem" && (
          <div className="w-[400px] bg-[#1B1D24] p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">Add New Skin</h1>
            
            {/* Tab Navigation */}
            <div className="flex mb-6 bg-[#2E323E] rounded-lg p-1">
              <button
                type="button"
                onClick={() => setActiveTab("csfloat")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                  activeTab === "csfloat"
                    ? "bg-[#1B1D24] text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                CSFloat Import
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("manual")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                  activeTab === "manual"
                    ? "bg-[#1B1D24] text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Manual Entry
              </button>
            </div>

            {/* Manual Entry Tab */}
            {activeTab === "manual" && (
              <form onSubmit={handleSubmit(onSubmit)}>
                <SkinAutocomplete
                  value={skinName}
                  onChange={(e) => setSkinName(e.target.value)}
                  onSelect={(selectedSkin) => setSkinName(selectedSkin)}
                  placeholder="Search for CS2 skin..."
                  className="w-full py-2 px-3 rounded-lg mb-3 bg-[#c1ceff0a] outline-none"
                  register={register}
                  name="skinName"
                  error={errors.skinName}
                />
                <input
                  {...register("floatValue", {
                    required: true,
                    pattern: {
                      value: /^\d*\.?\d+$/,
                      message: "Enter a valid float value"
                    }
                  })}
                  className="w-full py-2 px-3 rounded-lg mb-3 bg-[#c1ceff0a] outline-none"
                  placeholder="Float value (e.g., 0.123456)"
                />
                {errors.floatValue && <p className="text-red-500 text-sm">{errors.floatValue.message || "Float is required"}</p>}
                <div className="flex justify-around mb-4">
                  {["FN", "MW", "FT", "WW", "BS"].map((condition, index) => (
                    <button
                      key={condition}
                      type="button"
                      onClick={() => setValue("condition", condition)}
                      className={`flex-1 py-2 rounded-lg text-sm transition font-semibold
                        ${index === 0 ? "mr-1.5" : index === 4 ? "ml-1.5" : "mx-1.5"}
                        ${
                          watch("condition") === condition
                            ? "bg-[#2E323E] text-white cursor-pointer"
                            : "bg-[#c1ceff0a] text-gray-300 hover:bg-[#2E323E] cursor-pointer"
                        }`}
                    >
                      {condition}
                    </button>
                  ))}
                </div>
                {errors.condition && <p className="text-red-500 text-sm mb-2">Please select a condition</p>}
                
                <div className="flex justify-around mb-4">
                  {["Normal", "StatTrak™", "Souvenir"].map((itemType, index) => (
                    <button
                      key={itemType}
                      type="button"
                      onClick={() => setValue("itemType", itemType)}
                      className={`flex-1 py-2 rounded-lg text-sm transition font-semibold flex items-center justify-center
                        ${index === 0 ? "mr-1.5" : index === 2 ? "ml-1.5" : "mx-1.5"}
                        ${
                          (watch("itemType") || "Normal") === itemType
                            ? "bg-[#2E323E] cursor-pointer"
                            : "bg-[#c1ceff0a] hover:bg-[#2E323E] cursor-pointer"
                        }
                        ${
                          itemType === "StatTrak™"
                            ? (watch("itemType") || "Normal") === itemType
                              ? "text-[#D3662A]"
                              : "text-[#D3662A]"
                            : itemType === "Souvenir"
                            ? (watch("itemType") || "Normal") === itemType
                              ? "text-[#E0E051]"
                              : "text-[#E0E051]"
                            : (watch("itemType") || "Normal") === itemType
                            ? "text-white"
                            : "text-gray-300"
                        }`}
                    >
                      {itemType}
                    </button>
                  ))}
                </div>
                <div className='flex flex-row gap-3'>
                  <div className="relative">
                    <input
                      type="text"
                      {...register("buyPrice", { required: true })}
                      className="px-4 w-full py-2 pr-8 rounded-lg text-sm outline-none bg-[#c1ceff0a]"
                      placeholder="Buy price"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">$</span>
                    {errors.buyPrice && <span className="text-red-500 text-sm">This field is required</span>}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      {...register("expectedSellPrice", { required: true })}
                      className="px-4 w-full py-2 pr-8 rounded-lg text-sm outline-none bg-[#c1ceff0a]"
                      placeholder="Expected sell price"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">$</span>
                    {errors.expectedSellPrice && <span className="text-red-500 text-sm">This field is required</span>}
                  </div>
                </div>

                <input
                  {...register("buyDate")}
                  className="w-full py-2 px-3 rounded-lg mt-3 mb-4 bg-[#c1ceff0a] outline-none"
                  type="date"
                />

                <button type="submit" className="w-full bg-green-500 hover:bg-green-400 text-white py-2 rounded-lg cursor-pointer">
                  Submit
                </button>
              </form>
            )}

            {/* CSFloat Import Tab */}
            {activeTab === "csfloat" && (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    CSFloat Listing ID
                  </label>
                  <input
                    type="text"
                    value={csfloatId}
                    onChange={(e) => setCsfloatId(e.target.value)}
                    className="w-full py-2 px-3 rounded-lg bg-[#c1ceff0a] outline-none"
                    placeholder="Enter CSFloat listing ID (e.g., 123456)"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    You can find the listing ID in the CSFloat URL: csfloat.com/item/[ID]
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Expected Sell Price (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={csfloatExpectedPrice}
                      onChange={(e) => setCsfloatExpectedPrice(e.target.value)}
                      className="px-4 w-full py-2 pr-8 rounded-lg text-sm outline-none bg-[#c1ceff0a]"
                      placeholder="Expected sell price"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">$</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Leave empty to use the CSFloat listing price
                  </p>
                </div>

                <button
                  onClick={() => fetchCsfloatItem(csfloatId)}
                  disabled={!csfloatId || csfloatLoading}
                  className={`w-full py-2 rounded-lg font-medium transition ${
                    !csfloatId || csfloatLoading
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  }`}
                >
                  {csfloatLoading ? "Importing..." : "Import from CSFloat"}
                </button>
              </div>
            )}
            
            <p className="mt-3 text-center">{result}</p>
          </div>
        )}

        {activeView === "database" && (
          <div className="w-full max-w-[1330px] mx-auto px-4 pb-8">
            <div className="bg-[#1B1D24] p-6 rounded-lg shadow-md mb-6">
              <h1 className="text-2xl font-bold mb-4 text-center">Trade Database</h1>
              <div className="flex justify-center">
                <input
                  type="text"
                  placeholder="Search by skin name or buy date..."
                  value={filterText}
                  onChange={e => setFilterText(e.target.value)}
                  className="px-4 py-2 rounded-lg w-full max-w-md bg-[#c1ceff0a] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Unsold Items */}
              <div className="bg-[#1B1D24] rounded-lg shadow-md p-4">
                <h2 className="text-xl font-semibold mb-4 text-green-400 flex items-center">
                  <span className="mr-2">🟩</span>
                  Unsold Items ({unsoldTrades.length})
                </h2>
                <div className="bg-[#15171C] rounded-lg p-2">
                  <DataTable
                    columns={columns}
                    data={unsoldTrades}
                    progressPending={loading}
                    onRowClicked={(row) => {
                      setSelectedTrade(row);
                      setActualSellPrice(row.expectedSellPrice);
                      
                      // Set the default tab based on item status
                      if (row.sellStatus) {
                        setPopupActiveTab("viewInfo");
                      } else {
                        setPopupActiveTab("markAsSold");
                      }
                      
                      setOpen(true);
                    }}
                    selectableRows
                    onSelectedRowsChange={({ selectedRows }) => setSelectedUnsold(selectedRows)}
                    theme="dark"
                    pagination
                    paginationPerPage={30}
                    paginationRowsPerPageOptions={[10, 20, 30, 50, 100]}
                    highlightOnHover
                    pointerOnHover
                    dense
                    customStyles={{
                      table: {
                        style: {
                          backgroundColor: '#15171C',
                        },
                      },
                      headRow: {
                        style: {
                          backgroundColor: '#2E323E',
                          borderBottom: '1px solid #4A5568',
                        },
                      },
                      headCells: {
                        style: {
                          color: '#E2E8F0',
                          fontSize: '12px',
                          fontWeight: '600',
                        },
                      },
                      rows: {
                        style: {
                          backgroundColor: '#15171C',
                          borderBottom: '1px solid #2D3748',
                          '&:hover': {
                            backgroundColor: '#2E323E',
                            cursor: 'pointer',
                          },
                        },
                      },
                      cells: {
                        style: {
                          color: '#E2E8F0',
                          fontSize: '12px',
                        },
                      },
                      pagination: {
                        style: {
                          backgroundColor: '#2E323E',
                          borderTop: '1px solid #4A5568',
                          color: '#E2E8F0',
                          minHeight: '40px',
                        },
                        pageButtonsStyle: {
                          borderRadius: '4px',
                          height: '30px',
                          width: '30px',
                          padding: '0',
                          margin: '0 2px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          backgroundColor: 'transparent',
                          border: '1px solid #4A5568',
                          color: '#E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          '&:hover:not(:disabled)': {
                            backgroundColor: '#1B1D24',
                            borderColor: '#6B7280',
                          },
                          '&:disabled': {
                            cursor: 'not-allowed',
                            opacity: 0.5,
                          },
                        },
                      },
                    }}
                  />
                </div>
                {selectedUnsold.length > 0 && (
                  <div className="mt-4 text-sm text-center">
                    <span className="text-green-400">Selected {selectedUnsold.length} item(s)</span>
                    <button
                      onClick={deleteSelectedItems}
                      className="ml-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 cursor-pointer transition"
                    >
                      Delete Selected
                    </button>
                  </div>
                )}
              </div>

              {/* Sold Items */}
              <div className="bg-[#1B1D24] rounded-lg shadow-md p-4">
                <h2 className="text-xl font-semibold mb-4 text-blue-400 flex items-center">
                  <span className="mr-2">💼</span>
                  Sold Items ({soldTrades.length})
                </h2>
                <div className="bg-[#15171C] rounded-lg p-2">
                  <DataTable
                    columns={columnsSold}
                    data={soldTrades}
                    progressPending={loading}
                    onRowClicked={(row) => {
                      setSelectedTrade(row);
                      setActualSellPrice(row.actualSellPrice);
                      setPopupActiveTab("viewInfo");
                      setOpen(true);
                    }}
                    selectableRows
                    onSelectedRowsChange={({ selectedRows }) => setSelectedSold(selectedRows)}
                    theme="dark"
                    pagination
                    paginationPerPage={30}
                    paginationRowsPerPageOptions={[10, 20, 30, 50, 100]}
                    highlightOnHover
                    pointerOnHover
                    dense
                    customStyles={{
                      table: {
                        style: {
                          backgroundColor: '#15171C',
                        },
                      },
                      headRow: {
                        style: {
                          backgroundColor: '#2E323E',
                          borderBottom: '1px solid #4A5568',
                        },
                      },
                      headCells: {
                        style: {
                          color: '#E2E8F0',
                          fontSize: '12px',
                          fontWeight: '600',
                        },
                      },
                      rows: {
                        style: {
                          backgroundColor: '#15171C',
                          borderBottom: '1px solid #2D3748',
                          '&:hover': {
                            backgroundColor: '#2E323E',
                            cursor: 'pointer',
                          },
                        },
                      },
                      cells: {
                        style: {
                          color: '#E2E8F0',
                          fontSize: '12px',
                        },
                      },
                      pagination: {
                        style: {
                          backgroundColor: '#2E323E',
                          borderTop: '1px solid #4A5568',
                          color: '#E2E8F0',
                          minHeight: '40px',
                        },
                        pageButtonsStyle: {
                          borderRadius: '4px',
                          height: '30px',
                          width: '30px',
                          padding: '0',
                          margin: '0 2px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          backgroundColor: 'transparent',
                          border: '1px solid #4A5568',
                          color: '#E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          '&:hover:not(:disabled)': {
                            backgroundColor: '#1B1D24',
                            borderColor: '#6B7280',
                          },
                          '&:disabled': {
                            cursor: 'not-allowed',
                            opacity: 0.5,
                          },
                        },
                      },
                    }}
                  />
                </div>
                {selectedSold.length > 0 && (
                  <div className="mt-4 text-sm text-center">
                    <span className="text-blue-400">Selected {selectedSold.length} item(s)</span>
                    <button
                      onClick={deleteSelectedItems}
                      className="ml-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 cursor-pointer transition"
                    >
                      Delete Selected
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === "addFunds" && (
          <div className="w-[400px] bg-[#1B1D24] p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">Add Funds</h1>
            
            {/* Tab Navigation */}
            <div className="flex mb-6 bg-[#2E323E] rounded-lg p-1">
              <button
                type="button"
                onClick={() => setAddFundsTab("weeklyDrop")}
                className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition ${
                  addFundsTab === "weeklyDrop"
                    ? "bg-[#1B1D24] text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Weekly Drop
              </button>
              <button
                type="button"
                onClick={() => setAddFundsTab("otherFreeSkins")}
                className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition ${
                  addFundsTab === "otherFreeSkins"
                    ? "bg-[#1B1D24] text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Other Free Skins
              </button>
              <button
                type="button"
                onClick={() => setAddFundsTab("deposit")}
                className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition ${
                  addFundsTab === "deposit"
                    ? "bg-[#1B1D24] text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Deposit Funds
              </button>
            </div>

            {/* Weekly Drop Sale Tab */}
            {addFundsTab === "weeklyDrop" && (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    CSFloat Listing ID
                  </label>
                  <input
                    type="text"
                    value={weeklyDropCsfloatId}
                    onChange={(e) => setWeeklyDropCsfloatId(e.target.value)}
                    className="w-full py-2 px-3 rounded-lg bg-[#c1ceff0a] outline-none"
                    placeholder="Enter CSFloat listing ID (e.g., 123456)"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Paste the listing ID from the CSFloat sale of your weekly drop skin
                  </p>
                </div>

                <button
                  onClick={() => fetchWeeklyDropItem(weeklyDropCsfloatId)}
                  disabled={!weeklyDropCsfloatId || weeklyDropLoading}
                  className={`w-full py-2 rounded-lg font-medium transition ${
                    !weeklyDropCsfloatId || weeklyDropLoading
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                  }`}
                >
                  {weeklyDropLoading ? "Processing..." : "Add Weekly Drop Sale"}
                </button>
              </div>
            )}

            {/* Other Free Skins Tab */}
            {addFundsTab === "otherFreeSkins" && (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    CSFloat Listing ID
                  </label>
                  <input
                    type="text"
                    value={otherFreeCsfloatId}
                    onChange={(e) => setOtherFreeCsfloatId(e.target.value)}
                    className="w-full py-2 px-3 rounded-lg bg-[#c1ceff0a] outline-none"
                    placeholder="Enter CSFloat listing ID (e.g., 123456)"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    For free skins from events, giveaways, or other sources (not weekly drops)
                  </p>
                </div>

                <button
                  onClick={() => fetchOtherFreeSkinItem(otherFreeCsfloatId)}
                  disabled={!otherFreeCsfloatId || otherFreeLoading}
                  className={`w-full py-2 rounded-lg font-medium transition ${
                    !otherFreeCsfloatId || otherFreeLoading
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                  }`}
                >
                  {otherFreeLoading ? "Processing..." : "Add Other Free Skin Sale"}
                </button>
              </div>
            )}

            {/* Deposit Funds Tab */}
            {addFundsTab === "deposit" && (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Deposit Amount
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="px-4 w-full py-2 pr-8 rounded-lg text-sm outline-none bg-[#c1ceff0a]"
                      placeholder="Amount deposited"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">$</span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Deposit Date
                  </label>
                  <input
                    type="date"
                    value={depositDate}
                    onChange={(e) => setDepositDate(e.target.value)}
                    className="w-full py-2 px-3 rounded-lg bg-[#c1ceff0a] outline-none"
                  />
                </div>

                <div className="mb-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={depositFree}
                      onChange={(e) => setDepositFree(e.target.checked)}
                      className="w-4 h-4 text-green-600 bg-[#2E323E] border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <span className="text-sm text-gray-300">
                      This was a free deposit (didn't cost me money)
                    </span>
                  </label>
                  <p className="text-xs text-gray-400 mt-1">
                    Check this if you received free credits or promotional funds
                  </p>
                </div>

                <button
                  onClick={submitDeposit}
                  disabled={!depositAmount}
                  className={`w-full py-2 rounded-lg font-medium transition ${
                    !depositAmount
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  }`}
                >
                  Add Deposit
                </button>
              </div>
            )}
            
            <p className="mt-3 text-center">{addFundsResult}</p>
          </div>
        )}

        {activeView === "stats" && (
          <div className="w-full max-w-[1400px] mx-auto px-4 pb-8">
            <div className="bg-[#1B1D24] p-6 rounded-lg shadow-md mb-6">
              <h1 className="text-2xl font-bold mb-2 text-center">Trading Statistics</h1>
              <p className="text-center text-gray-400">Your comprehensive trading performance overview</p>
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto">
              
              {/* Total Profit - Large Card */}
              <div className="lg:col-span-2 lg:row-span-2 bg-gradient-to-br from-green-600 via-green-700 to-green-800 rounded-lg p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] transform cursor-pointer">
                <h3 className="text-lg font-semibold mb-2">Total Profit</h3>
                <div className="text-4xl font-bold mb-4">${stats.totalProfit}</div>
                <div className="text-sm opacity-90 mb-4">
                  <p>Revenue: ${stats.totalRevenue}</p>
                  <p>Investment: ${stats.totalInvestment}</p>
                  <p>Margin: {stats.profitMargin}%</p>
                </div>
                {/* Beautiful Profit Over Time Chart */}
                <div className="h-32">
                  <div className="text-xs mb-2">Total Profit Over Time</div>
                  <div className="h-24">
                    <ResponsiveLine
                      data={prepareProfitOverTimeData()}
                      margin={{ top: 5, right: 5, bottom: 20, left: 30 }}
                      xScale={{ type: 'point' }}
                      yScale={{ 
                        type: 'linear', 
                        min: 'auto', 
                        max: 'auto', 
                        stacked: false, 
                        reverse: false 
                      }}
                      curve="monotoneX"
                      axisTop={null}
                      axisRight={null}
                      axisBottom={{
                        tickSize: 0,
                        tickPadding: 5,
                        tickRotation: 0,
                        tickValues: 0
                      }}
                      axisLeft={{
                        tickSize: 0,
                        tickPadding: 5,
                        tickRotation: 0,
                        tickValues: 3,
                        format: v => `$${v}`
                      }}
                      colors={["#ffffff"]}
                      pointSize={4}
                      pointColor={{ from: 'color', modifiers: [] }}
                      pointBorderWidth={2}
                      pointBorderColor={{ from: 'serieColor' }}
                      pointLabelYOffset={-12}
                      enableArea={true}
                      areaOpacity={0.3}
                      useMesh={true}
                      enableGridX={false}
                      enableGridY={true}
                      gridYValues={3}
                      theme={{
                        background: 'transparent',
                        text: {
                          fontSize: 10,
                          fill: '#ffffff',
                        },
                        axis: {
                          domain: {
                            line: {
                              stroke: '#ffffff',
                              strokeWidth: 1,
                            },
                          },
                          legend: {
                            text: {
                              fontSize: 10,
                              fill: '#ffffff',
                            },
                          },
                          ticks: {
                            line: {
                              stroke: '#ffffff',
                              strokeWidth: 1,
                            },
                            text: {
                              fontSize: 9,
                              fill: '#ffffff',
                            },
                          },
                        },
                        grid: {
                          line: {
                            stroke: '#ffffff',
                            strokeWidth: 0.5,
                            strokeOpacity: 0.3,
                          },
                        },
                        tooltip: {
                          container: {
                            background: '#1B1D24',
                            color: '#ffffff',
                            fontSize: '12px',
                            borderRadius: '4px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          },
                        },
                      }}
                      tooltip={({ point }) => (
                        <div className="bg-[#1B1D24] px-2 py-1 rounded border border-gray-600 text-white text-xs">
                          <div>{point.data.x}</div>
                          <div className="font-bold">${parseFloat(point.data.y).toFixed(2)}</div>
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Weekly Drop Earnings */}
              <div 
                onClick={() => openHistoryPopup("weekly_drop")}
                className="bg-gradient-to-br from-[#1B1D24] to-[#252830] rounded-lg p-4 border border-green-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform hover:border-green-400 cursor-pointer"
              >
                <h3 className="text-sm font-semibold mb-2 text-green-400">Weekly Drop Earnings</h3>
                <div className="text-2xl font-bold text-white">${stats.weeklyDropEarnings}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Free money from weekly drops
                </div>
              </div>

              {/* Other Free Skins */}
              <div 
                onClick={() => openHistoryPopup("other_free_skin")}
                className="bg-gradient-to-br from-[#1B1D24] to-[#252830] rounded-lg p-4 border border-purple-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform hover:border-purple-400 cursor-pointer"
              >
                <h3 className="text-sm font-semibold mb-2 text-purple-400">Other Free Skins</h3>
                <div className="text-2xl font-bold text-white">${stats.otherFreeEarnings}</div>
                <div className="text-xs text-gray-400 mt-1">
                  From armory, cases or other accounts
                </div>
              </div>

              {/* Total Funds Added */}
              <div className="bg-gradient-to-br from-[#1B1D24] to-[#252830] rounded-lg p-4 border border-blue-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform hover:border-blue-400">
                <h3 className="text-sm font-semibold mb-2 text-blue-400">Total Funds Added</h3>
                <div className="text-2xl font-bold text-white">${stats.totalFundsAdded}</div>
                <div className="text-xs text-gray-400 mt-1">
                  All deposits + free earnings
                </div>
              </div>

              {/* Paid Deposits */}
              <div className="bg-gradient-to-br from-[#1B1D24] to-[#252830] rounded-lg p-4 border border-orange-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform hover:border-orange-400">
                <h3 className="text-sm font-semibold mb-2 text-orange-400">Paid Deposits</h3>
                <div className="text-2xl font-bold text-white">${stats.paidDeposits}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Your own money invested
                </div>
              </div>

              {/* Beautiful Funds Over Time Chart */}
              <div className="lg:col-span-2 bg-gradient-to-br from-[#1B1D24] to-[#252830] rounded-lg p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                <h3 className="text-lg font-semibold mb-4 text-white">Total Funds Added Over Time</h3>
                <div className="h-48">
                  <ResponsiveLine
                    data={prepareFundsOverTimeData()}
                    margin={{ top: 20, right: 60, bottom: 50, left: 60 }}
                    xScale={{ type: 'point' }}
                    yScale={{ 
                      type: 'linear', 
                      min: 0, 
                      max: 'auto', 
                      stacked: false, 
                      reverse: false 
                    }}
                    curve="monotoneX"
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45,
                      tickValues: 5,
                      legend: 'Date',
                      legendOffset: 40,
                      legendPosition: 'middle'
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Total Funds ($)',
                      legendOffset: -45,
                      legendPosition: 'middle',
                      format: v => `$${v}`
                    }}
                    colors={['#3B82F6']} // Single blue color for the total funds line
                    pointSize={6}
                    pointColor={{ from: 'color', modifiers: [] }}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: 'serieColor' }}
                    enableArea={true}
                    areaOpacity={0.2}
                    useMesh={true}
                    enableGridX={false}
                    enableGridY={true}
                    theme={{
                      background: 'transparent',
                      text: {
                        fontSize: 11,
                        fill: '#ffffff',
                      },
                      axis: {
                        domain: {
                          line: {
                            stroke: '#6B7280',
                            strokeWidth: 1,
                          },
                        },
                        legend: {
                          text: {
                            fontSize: 12,
                            fill: '#ffffff',
                          },
                        },
                        ticks: {
                          line: {
                            stroke: '#6B7280',
                            strokeWidth: 1,
                          },
                          text: {
                            fontSize: 10,
                            fill: '#ffffff',
                          },
                        },
                      },
                      grid: {
                        line: {
                          stroke: '#374151',
                          strokeWidth: 1,
                          strokeOpacity: 0.5,
                        },
                      },
                      tooltip: {
                        container: {
                          background: '#1B1D24',
                          color: '#ffffff',
                          fontSize: '12px',
                          borderRadius: '4px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          border: '1px solid #374151',
                        },
                      },
                    }}
                    tooltip={({ point }) => (
                      <div className="bg-[#1B1D24] px-3 py-2 rounded border border-gray-600 text-white text-sm">
                        <div className="font-semibold">Total Funds</div>
                        <div>Date: {point.data.x}</div>
                        <div className="font-bold text-blue-400">${parseFloat(point.data.y).toFixed(2)}</div>
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Trade Summary */}
              <div className="bg-gradient-to-br from-[#1B1D24] to-[#252830] rounded-lg p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] transform">
                <h3 className="text-lg font-semibold mb-4 text-white">Trade Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Trades:</span>
                    <span className="text-white font-semibold">{stats.totalTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sold:</span>
                    <span className="text-green-400 font-semibold">{stats.soldTradesCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Unsold:</span>
                    <span className="text-yellow-400 font-semibold">{stats.unsoldTradesCount}</span>
                  </div>
                  <div className="border-t border-gray-600 pt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Success Rate:</span>
                      <span className="text-white font-semibold">
                        {stats.totalTrades > 0 ? Math.round((stats.soldTradesCount / stats.totalTrades) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-gradient-to-br from-[#1B1D24] to-[#252830] rounded-lg p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] transform">
                <h3 className="text-lg font-semibold mb-4 text-white">Performance</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-400 text-sm">Profit Margin</span>
                      <span className="text-white text-sm">{stats.profitMargin}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{width: `${Math.min(100, Math.max(0, stats.profitMargin + 50))}%`}}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-2 space-y-2">
                    <div>
                      <div className="text-sm text-gray-400">Avg Profit per Trade:</div>
                      <div className="text-white font-semibold">
                        ${stats.soldTradesCount > 0 ? (stats.totalProfit / stats.soldTradesCount).toFixed(2) : '0.00'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Avg Sell Time:</div>
                      <div className="text-white font-semibold">
                        {stats.avgSellTime > 0 ? `${stats.avgSellTime} days` : 'No data'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Avg Profit %:</div>
                      <div className="text-white font-semibold">
                        {stats.avgProfitPercent > 0 ? `${stats.avgProfitPercent}%` : 'No data'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Total Inventory Value:</div>
                      <div className="text-white font-semibold">
                        ${stats.totalInventoryValue}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Funds Distribution Pie Chart */}
              <div className="lg:col-span-2 bg-gradient-to-br from-[#1B1D24] to-[#252830] rounded-lg p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                <h3 className="text-lg font-semibold mb-4 text-white">Funds Distribution</h3>
                <div className="h-48">
                  <ResponsivePie
                    data={prepareFundsDistributionData()}
                    margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
                    innerRadius={0.5}
                    padAngle={2}
                    cornerRadius={4}
                    activeOuterRadiusOffset={8}
                    colors={{ datum: 'data.color' }}
                    borderWidth={2}
                    borderColor={{
                      from: 'color',
                      modifiers: [
                        ['darker', 0.6]
                      ]
                    }}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor="#ffffff"
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: 'color' }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor={{
                      from: 'color',
                      modifiers: [
                        ['darker', 3]
                      ]
                    }}
                    theme={{
                      background: 'transparent',
                      text: {
                        fontSize: 11,
                        fill: '#ffffff',
                      },
                      tooltip: {
                        container: {
                          background: '#1B1D24',
                          color: '#ffffff',
                          fontSize: '12px',
                          borderRadius: '4px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          border: '1px solid #374151',
                        },
                      },
                    }}
                    tooltip={({ datum }) => (
                      <div className="bg-[#1B1D24] px-3 py-2 rounded border border-gray-600 text-white text-sm">
                        <div className="font-semibold" style={{ color: datum.color }}>
                          {datum.label}
                        </div>
                        <div className="font-bold">${datum.value}</div>
                        <div className="text-xs text-gray-400">
                          {((datum.value / stats.totalFundsAdded) * 100).toFixed(1)}%
                        </div>
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Monthly Profit Bar Chart */}
              <div className="lg:col-span-2 bg-gradient-to-br from-[#1B1D24] to-[#252830] rounded-lg p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                <h3 className="text-lg font-semibold mb-4 text-white">Monthly Profit Overview</h3>
                <div className="h-48">
                  <ResponsiveBar
                    data={prepareMonthlyProfitData()}
                    keys={['profit']}
                    indexBy="month"
                    margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
                    padding={0.3}
                    groupMode="grouped"
                    valueScale={{ type: 'linear' }}
                    indexScale={{ type: 'band', round: true }}
                    colors={({ value }) => value >= 0 ? '#10B981' : '#EF4444'}
                    borderRadius={4}
                    borderWidth={1}
                    borderColor={{
                      from: 'color',
                      modifiers: [
                        ['darker', 0.3]
                      ]
                    }}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45,
                      legend: 'Month',
                      legendPosition: 'middle',
                      legendOffset: 40
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Profit ($)',
                      legendPosition: 'middle',
                      legendOffset: -45,
                      format: v => `$${v}`
                    }}
                    enableGridY={true}
                    enableLabel={true}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    labelTextColor={{
                      from: 'color',
                      modifiers: [
                        ['darker', 2]
                      ]
                    }}
                    theme={{
                      background: 'transparent',
                      text: {
                        fontSize: 11,
                        fill: '#ffffff',
                      },
                      axis: {
                        domain: {
                          line: {
                            stroke: '#6B7280',
                            strokeWidth: 1,
                          },
                        },
                        legend: {
                          text: {
                            fontSize: 12,
                            fill: '#ffffff',
                          },
                        },
                        ticks: {
                          line: {
                            stroke: '#6B7280',
                            strokeWidth: 1,
                          },
                          text: {
                            fontSize: 10,
                            fill: '#ffffff',
                          },
                        },
                      },
                      grid: {
                        line: {
                          stroke: '#374151',
                          strokeWidth: 1,
                          strokeOpacity: 0.5,
                        },
                      },
                      tooltip: {
                        container: {
                          background: '#1B1D24',
                          color: '#ffffff',
                          fontSize: '12px',
                          borderRadius: '4px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          border: '1px solid #374151',
                        },
                      },
                    }}
                    tooltip={({ id, value, indexValue, color }) => (
                      <div className="bg-[#1B1D24] px-3 py-2 rounded border border-gray-600 text-white text-sm">
                        <div className="font-semibold">{indexValue}</div>
                        <div className="font-bold" style={{ color }}>
                          ${value}
                        </div>
                      </div>
                    )}
                  />
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* History Popup */}
      <Popup nested open={historyPopupOpen} closeOnDocumentClick onClose={closeHistoryPopup}>
        <div className='p-6 flex flex-col bg-[#1B1D24] shadow-lg items-center gap-4 rounded-lg min-w-[600px] max-w-[800px]'>
          <h2 className='text-2xl font-extrabold text-white'>
            {historyType === "weeklyDrop" ? "Weekly Drop History" : "Other Free Skins History"}
          </h2>
          
          <div className="w-full max-h-[500px] overflow-y-auto">
            {historyData.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p>No {historyType === "weeklyDrop" ? "weekly drop" : "other free skin"} sales found.</p>
                <p className="text-sm mt-2">Start adding funds to see your history here!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyData.map((item, index) => (
                  <div key={index} className="bg-[#2E323E] rounded-lg p-4 border border-gray-600">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Skin Name:</p>
                        <p className="text-white font-semibold">{item.skinName || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Amount:</p>
                        <p className="text-green-400 font-bold text-lg">${item.amount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Date Added:</p>
                        <p className="text-white">{item.date || "N/A"}</p>
                      </div>
                      {item.floatValue && (
                        <div>
                          <p className="text-sm text-gray-400">Float Value:</p>
                          <p className="text-white">{item.floatValue}</p>
                        </div>
                      )}
                      {item.condition && (
                        <div>
                          <p className="text-sm text-gray-400">Condition:</p>
                          <p className="text-white">{item.condition}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex gap-4 mt-4">
            <button
              onClick={closeHistoryPopup}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg cursor-pointer transition"
            >
              Close
            </button>
          </div>
        </div>
      </Popup>
    </div>
  );
}
