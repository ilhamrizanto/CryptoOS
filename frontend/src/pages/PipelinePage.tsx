import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  X,
  Layers,
  AlertTriangle,
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Coins,
  Target,
  CheckCircle2,
  Calculator,
  Upload,
} from 'lucide-react';
import { api } from '../services/api';
import { evidenceDb } from '../services/db';
import { useMarketData } from '../hooks/useMarketData';
import { DualCurrencyValue } from '../components/ui/DualCurrencyValue';
import { TradeIdea, TradeDirection, IdeaStatus } from '../types/trade.types';
import { formatCompactUsd } from '../utils/formatters';

export const PipelinePage: React.FC = () => {
  const navigate = useNavigate();
  const { intel } = useMarketData();

  // Ideas List & Selected Idea State
  const [ideas, setIdeas] = useState<TradeIdea[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form Fields
  const [ticker, setTicker] = useState('SOLUSDT');
  const [coinId, setCoinId] = useState('solana');
  const [direction, setDirection] = useState<TradeDirection>('LONG');
  const [timeframe, setTimeframe] = useState('4H');
  const [status, setStatus] = useState<IdeaStatus>('WATCHLIST');

  // Search Token Dropdown
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; symbol: string; thumb?: string }>>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Pilar 1: Makro
  const [macroRegime, setMacroRegime] = useState<'RISK_ON' | 'RISK_OFF' | 'NEUTRAL'>('RISK_ON');
  const [macroNotes, setMacroNotes] = useState('');

  // Pilar 2: Fundamental
  const [fundamentalData, setFundamentalData] = useState({
    name: 'Solana',
    symbol: 'SOL',
    currentPriceUsd: 185.5,
    marketCapUsd: 88_400_000_000,
    fdvUsd: 99_200_000_000,
    fdvToMcapRatio: 1.12,
    circulatingSupply: 470_000_000,
    totalSupply: 580_000_000,
    volume24hUsd: 4_200_000_000,
    priceChange24h: 3.8,
  });
  const [fundamentalNotes, setFundamentalNotes] = useState('');
  const [isFetchingFundamental, setIsFetchingFundamental] = useState(false);

  // Pilar 3: Price Action
  const [marketStructure, setMarketStructure] = useState<'BULLISH_BOS' | 'BEARISH_BOS' | 'RANGE' | 'CHoCH'>('BULLISH_BOS');
  const [entryPrice, setEntryPrice] = useState<number>(185.2);
  const [stopLossPrice, setStopLossPrice] = useState<number>(178.5);
  const [tp1Price, setTp1Price] = useState<number>(210.0);
  const [tp2Price, setTp2Price] = useState<number>(235.0);
  const [tp3Price, setTp3Price] = useState<number>(260.0);
  const [riskPercent, setRiskPercent] = useState<number>(2.0);
  const [confluences, setConfluences] = useState<string[]>([
    'Asian Low Swept',
    '4H Bullish Order Block',
    'Liquidity Run into Discount Zone',
  ]);
  const [newConfluenceInput, setNewConfluenceInput] = useState('');
  const [priceActionNotes, setPriceActionNotes] = useState('');

  // Pilar 4: Bukti On-Chain & Coinglass
  const [oiTrend, setOiTrend] = useState<'INCREASING' | 'DECREASING' | 'STABLE'>('INCREASING');
  const [fundingRateStatus, setFundingRateStatus] = useState<'POSITIVE_EXTREME' | 'NEGATIVE_EXTREME' | 'HEALTHY'>('HEALTHY');
  const [cvdDivergence, setCvdDivergence] = useState<'BULLISH_DIV' | 'BEARISH_DIV' | 'CONVERGENT'>('BULLISH_DIV');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [screenshots, setScreenshots] = useState<Array<{ id: string; url: string; caption?: string }>>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // General Notes
  const [generalNotes, setGeneralNotes] = useState('');

  // Notification Banner Helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load screenshots from IndexedDB whenever selected idea changes
  const loadScreenshots = useCallback(async (ideaId: string) => {
    try {
      const items = await evidenceDb.getScreenshotsByIdea(ideaId);
      setScreenshots(items);
    } catch (e) {
      console.error('Failed to read screenshots from IndexedDB:', e);
    }
  }, []);

  const populateIdea = useCallback((idea: TradeIdea) => {
    setSelectedIdeaId(idea.id);
    setTicker(idea.symbol);
    setDirection(idea.direction);
    setTimeframe(idea.timeframe || '4H');
    setStatus(idea.status || 'WATCHLIST');
    setEntryPrice(idea.entryPrice ?? 0);
    setStopLossPrice(idea.stopLossPrice ?? 0);
    setTp1Price(idea.tp1Price ?? 0);
    setTp2Price(idea.tp2Price ?? 0);
    setTp3Price(idea.tp3Price ?? 0);
    setRiskPercent(idea.riskPercent ?? 2.0);
    setGeneralNotes(idea.notes ?? '');

    if (idea.macroData) {
      setMacroRegime(idea.macroData.marketRegime || 'RISK_ON');
      setMacroNotes(idea.macroData.notes || '');
    }

    if (idea.fundamentalData) {
      setFundamentalData((prev) => ({
        ...prev,
        name: idea.fundamentalData?.name || prev.name,
        symbol: idea.fundamentalData?.symbol || prev.symbol,
        currentPriceUsd: idea.fundamentalData?.currentPriceUsd ?? prev.currentPriceUsd,
        marketCapUsd: idea.fundamentalData?.marketCapUsd ?? prev.marketCapUsd,
        fdvUsd: idea.fundamentalData?.fdvUsd ?? prev.fdvUsd,
        fdvToMcapRatio: idea.fundamentalData?.fdvToMcapRatio ?? prev.fdvToMcapRatio,
      }));
      setFundamentalNotes(idea.fundamentalData.notes || '');
    }

    if (idea.priceActionData) {
      setMarketStructure(idea.priceActionData.marketStructure || 'BULLISH_BOS');
      setPriceActionNotes(idea.priceActionData.notes || '');
      if (idea.priceActionData.confluenceFactors && idea.priceActionData.confluenceFactors.length > 0) {
        setConfluences(idea.priceActionData.confluenceFactors);
      }
    }

    if (idea.evidenceData) {
      setOiTrend(idea.evidenceData.coinglassChecklist?.openInterestTrend || 'INCREASING');
      setFundingRateStatus(idea.evidenceData.coinglassChecklist?.fundingRateStatus || 'HEALTHY');
      setCvdDivergence(idea.evidenceData.coinglassChecklist?.cvdDivergence || 'BULLISH_DIV');
      setEvidenceNotes(idea.evidenceData.notes || '');
    }

    loadScreenshots(idea.id);
  }, [loadScreenshots]);

  // Load All Ideas from backend
  const loadIdeas = useCallback(async () => {
    try {
      const data = await api.get<TradeIdea[]>('/ideas');
      setIdeas(data || []);
      if (!selectedIdeaId && data && data.length > 0) {
        populateIdea(data[0]);
      }
    } catch (e) {
      console.error('Failed to load ideas:', e);
    }
  }, [selectedIdeaId, populateIdea]);

  useEffect(() => {
    loadIdeas();
  }, [loadIdeas]);

  const handleNewDraft = () => {
    setSelectedIdeaId(null);
    setTicker('BTCUSDT');
    setCoinId('bitcoin');
    setDirection('LONG');
    setTimeframe('4H');
    setStatus('WATCHLIST');
    setEntryPrice(95000);
    setStopLossPrice(92000);
    setTp1Price(104000);
    setTp2Price(112000);
    setTp3Price(120000);
    setRiskPercent(2.0);
    setGeneralNotes('');
    setMacroNotes('');
    setFundamentalNotes('');
    setPriceActionNotes('');
    setEvidenceNotes('');
    setConfluences([
      'Liquidity Sweep at Asian Session',
      '4H Bullish Order Block + Imbalance FVG',
      'CVD Spot Accumulation Divergence',
    ]);
    setScreenshots([]);
    fetchFundamentalData('bitcoin');
    showToast('Created new setup draft form');
  };

  // Search Coin on typing
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await api.get<Array<{ id: string; name: string; symbol: string; thumb?: string }>>(
          `/market/coin/search?q=${encodeURIComponent(searchQuery)}`
        );
        setSearchResults(results || []);
        setShowSearchDropdown(true);
      } catch (e) {
        console.error('Error searching coin:', e);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Fundamental Data
  const fetchFundamentalData = async (targetCoinId: string) => {
    try {
      setIsFetchingFundamental(true);
      const data = await api.get<any>(`/market/coin/${encodeURIComponent(targetCoinId)}/fundamental`);
      if (data) {
        setFundamentalData({
          name: data.name,
          symbol: data.symbol,
          currentPriceUsd: data.currentPriceUsd,
          marketCapUsd: data.marketCapUsd,
          fdvUsd: data.fdvUsd,
          fdvToMcapRatio: data.fdvToMcapRatio,
          circulatingSupply: data.circulatingSupply,
          totalSupply: data.totalSupply,
          volume24hUsd: data.volume24hUsd,
          priceChange24h: data.priceChange24h,
        });
        if (data.currentPriceUsd && entryPrice === 0) {
          setEntryPrice(data.currentPriceUsd);
          setStopLossPrice(direction === 'LONG' ? data.currentPriceUsd * 0.95 : data.currentPriceUsd * 1.05);
          setTp1Price(direction === 'LONG' ? data.currentPriceUsd * 1.15 : data.currentPriceUsd * 0.85);
        }
        showToast(`Fundamental metrics for ${data.name} synced!`);
      }
    } catch (e) {
      console.error('Error fetching coin fundamentals:', e);
      showToast('Failed to sync CoinGecko data, using cached values', 'error');
    } finally {
      setIsFetchingFundamental(false);
    }
  };

  const handleSelectCoin = (coin: { id: string; name: string; symbol: string }) => {
    setCoinId(coin.id);
    setTicker(`${coin.symbol.toUpperCase()}USDT`);
    setShowSearchDropdown(false);
    setSearchQuery('');
    fetchFundamentalData(coin.id);
  };

  // Clipboard Paste Screenshot Handler (Ctrl+V)
  const handleSaveBlobScreenshot = useCallback(
    async (file: File | Blob) => {
      try {
        const screenshotId = `ss_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await evidenceDb.saveScreenshot({
          id: screenshotId,
          blob: file,
          ideaId: selectedIdeaId || 'temp_draft',
          caption: `Screenshot ${new Date().toLocaleTimeString()}`,
        });

        const newScreenshot = {
          id: screenshotId,
          url: URL.createObjectURL(file),
          caption: `Screenshot ${new Date().toLocaleTimeString()}`,
        };

        setScreenshots((prev) => [newScreenshot, ...prev]);
        showToast('Chart evidence screenshot saved to IndexedDB!');
      } catch (err) {
        console.error('Failed to save screenshot blob:', err);
        showToast('Failed to save screenshot to IndexedDB', 'error');
      }
    },
    [selectedIdeaId]
  );

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      const items = clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleSaveBlobScreenshot(file);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleSaveBlobScreenshot]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleSaveBlobScreenshot(files[0]);
    }
  };

  const handleDeleteScreenshot = async (id: string) => {
    try {
      await evidenceDb.deleteScreenshot(id);
      setScreenshots((prev) => prev.filter((s) => s.id !== id));
      showToast('Screenshot removed');
    } catch (e) {
      console.error('Failed to delete screenshot:', e);
    }
  };

  // Add / Remove Confluence Tag
  const handleAddConfluence = (e: React.FormEvent) => {
    e.preventDefault();
    if (newConfluenceInput.trim() && !confluences.includes(newConfluenceInput.trim())) {
      setConfluences([...confluences, newConfluenceInput.trim()]);
      setNewConfluenceInput('');
    }
  };

  const handleRemoveConfluence = (tag: string) => {
    setConfluences(confluences.filter((c) => c !== tag));
  };

  // Calculations for Price Action & Risk-Reward
  const calculateRiskReward = () => {
    if (!entryPrice || !stopLossPrice || !tp1Price) {
      return { riskAmount: 0, rewardAmount: 0, rrRatio: 0, slPercent: 0, tpPercent: 0, isValid: false, warning: '' };
    }

    let riskAmount = 0;
    let rewardAmount = 0;
    let isValid = true;
    let warning = '';

    if (direction === 'LONG') {
      riskAmount = entryPrice - stopLossPrice;
      rewardAmount = tp1Price - entryPrice;
      if (stopLossPrice >= entryPrice) {
        isValid = false;
        warning = 'Stop Loss must be below Entry price for LONG positions!';
      }
      if (tp1Price <= entryPrice) {
        isValid = false;
        warning = 'Take Profit 1 must be above Entry price for LONG positions!';
      }
    } else {
      riskAmount = stopLossPrice - entryPrice;
      rewardAmount = entryPrice - tp1Price;
      if (stopLossPrice <= entryPrice) {
        isValid = false;
        warning = 'Stop Loss must be above Entry price for SHORT positions!';
      }
      if (tp1Price >= entryPrice) {
        isValid = false;
        warning = 'Take Profit 1 must be below Entry price for SHORT positions!';
      }
    }

    const slPercent = entryPrice > 0 ? (riskAmount / entryPrice) * 100 : 0;
    const tpPercent = entryPrice > 0 ? (rewardAmount / entryPrice) * 100 : 0;
    const rrRatio = riskAmount > 0 ? parseFloat((rewardAmount / riskAmount).toFixed(2)) : 0;
    return { riskAmount, rewardAmount, rrRatio, slPercent, tpPercent, isValid, warning };
  };

  const rrInfo = calculateRiskReward();

  // 4-Pillar Readiness Checker
  const checkPillarReadiness = (targetIdea?: TradeIdea) => {
    if (!targetIdea) {
      const p1 = !!macroRegime;
      const p2 = fundamentalData.marketCapUsd > 0;
      const p3 = rrInfo.isValid && rrInfo.rrRatio >= 1.0;
      const p4 = screenshots.length > 0 || !!evidenceNotes;
      const count = [p1, p2, p3, p4].filter(Boolean).length;
      return { p1, p2, p3, p4, count, isComplete: count === 4 };
    } else {
      const p1 = !!targetIdea.macroData?.marketRegime;
      const p2 = !!targetIdea.fundamentalData?.marketCapUsd;
      const p3 = !!targetIdea.entryPrice && !!targetIdea.stopLossPrice && !!targetIdea.tp1Price;
      const p4 = (targetIdea.evidenceData?.screenshotIds?.length ?? 0) > 0 || !!targetIdea.evidenceData?.notes;
      const count = [p1, p2, p3, p4].filter(Boolean).length;
      return { p1, p2, p3, p4, count, isComplete: count === 4 };
    }
  };

  const currentReadiness = checkPillarReadiness();

  // Save / Update Idea
  const handleSaveIdea = async () => {
    try {
      setIsSaving(true);
      const payload = {
        symbol: ticker,
        direction,
        timeframe,
        status,
        entryPrice,
        stopLossPrice,
        tp1Price,
        tp2Price,
        tp3Price,
        riskPercent,
        notes: generalNotes,
        macroData: {
          marketRegime: macroRegime,
          dxyTrend: intel?.forex?.dxy?.change24h && intel.forex.dxy.change24h > 0 ? 'BULLISH' : 'BEARISH',
          fedExpectation: `${intel?.fedwatch?.noChangeProb || 82.8}% Pause / ${intel?.fedwatch?.hikeProb || 17.2}% Hike`,
          notes: macroNotes,
        },
        fundamentalData: {
          coinGeckoId: coinId,
          name: fundamentalData.name,
          symbol: fundamentalData.symbol,
          marketCapUsd: fundamentalData.marketCapUsd,
          fdvUsd: fundamentalData.fdvUsd,
          fdvToMcapRatio: fundamentalData.fdvToMcapRatio,
          currentPriceUsd: fundamentalData.currentPriceUsd,
          circulatingSupply: fundamentalData.circulatingSupply,
          volume24hUsd: fundamentalData.volume24hUsd,
          notes: fundamentalNotes,
        },
        priceActionData: {
          marketStructure,
          confluenceFactors: confluences,
          notes: priceActionNotes,
        },
        evidenceData: {
          screenshotIds: screenshots.map((s) => s.id),
          coinglassChecklist: {
            openInterestTrend: oiTrend,
            fundingRateStatus,
            cvdDivergence,
          },
          notes: evidenceNotes,
        },
      };

      if (selectedIdeaId) {
        await api.patch(`/ideas/${selectedIdeaId}`, payload);
        showToast(`Setup ${ticker} successfully updated in database!`);
      } else {
        const created = await api.post<TradeIdea>('/ideas', payload);
        setSelectedIdeaId(created.id);
        showToast(`New setup ${ticker} saved to Pipeline!`);
      }

      await loadIdeas();
    } catch (e) {
      console.error('Failed to save idea:', e);
      showToast('Failed to save setup to database', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Idea
  const handleDeleteIdea = async (ideaId: string, symbol: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Delete setup idea ${symbol} from Pipeline?`)) return;

    try {
      await api.delete(`/ideas/${ideaId}`);
      showToast(`Setup idea ${symbol} deleted!`);
      if (selectedIdeaId === ideaId) {
        setSelectedIdeaId(null);
        handleNewDraft();
      }
      await loadIdeas();
    } catch (err) {
      console.error('Failed to delete idea:', err);
      showToast('Failed to delete setup idea', 'error');
    }
  };

  // Transfer Idea to Journal
  const handleTransferToJournal = async () => {
    if (!selectedIdeaId) {
      showToast('Please save this setup draft before dispatching to Journal!', 'error');
      return;
    }

    try {
      setIsTransferring(true);
      const res = await api.post<{ journalId: string; symbol: string }>(`/ideas/${selectedIdeaId}/to-journal`, {
        positionSize: entryPrice > 0 ? 1000 / entryPrice : 1,
      });

      showToast(`Setup ${res.symbol} dispatched to Trade Journal! Opening Journal...`);
      setTimeout(() => {
        navigate('/journal');
      }, 1200);
    } catch (e) {
      console.error('Failed to transfer to journal:', e);
      showToast('Failed to dispatch setup to journal', 'error');
    } finally {
      setIsTransferring(false);
    }
  };

  // Bridge to Calculator (Position Sizer)
  const handleNavigateToCalculator = () => {
    navigate('/calculator', {
      state: {
        ticker,
        direction,
        entryPrice,
        stopLossPrice,
        takeProfitPrice: tp1Price,
        riskPercent,
      },
    });
  };

  // BTC Production Cost Context
  const isBtcSetup = ticker.toUpperCase().includes('BTC');
  const btcCost = 68500;
  const btcPrice = fundamentalData.currentPriceUsd > 0 ? fundamentalData.currentPriceUsd : 94800;

  // Dilution Gap Calculation
  const dilutionCirculatingPercent =
    fundamentalData.fdvUsd > 0
      ? Math.min(100, Math.round((fundamentalData.marketCapUsd / fundamentalData.fdvUsd) * 100))
      : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', paddingBottom: '140px' }}>
      {/* Toast Notification */}
      {notification && (
        <div className={`terminal-toast toast-enter ${notification.type === 'error' ? 'error' : ''}`}>
          {notification.type === 'error' ? (
            <AlertTriangle size={15} color="var(--color-bearish)" />
          ) : (
            <Sparkles size={15} color="var(--color-accent-primary)" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Lightbox Modal */}
      {previewImageUrl && (
        <div
          className="modal-backdrop-animate"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            zIndex: 10000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px',
            backdropFilter: 'blur(8px)',
          }}
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="modal-dialog-animate" style={{ position: 'relative', maxWidth: '92vw', maxHeight: '90vh' }}>
            <button
              onClick={() => setPreviewImageUrl(null)}
              style={{
                position: 'absolute',
                top: '-44px',
                right: '0',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: '#fff',
                padding: '6px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
              }}
            >
              <X size={16} />
              <span>Close Preview</span>
            </button>
            <img
              src={previewImageUrl}
              alt="Screenshot Evidence Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border-accent)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              }}
            />
          </div>
        </div>
      )}

      {/* Header (Aligned with Terminal Workstation Standard) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-accent-primary)', fontWeight: 800, letterSpacing: '0.06em' }}>
              PIPELINE & IDEA INCUBATOR
            </span>
            <span style={{ color: 'var(--color-border)' }}>&bull;</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              4-PILLAR QUANTITATIVE FRAMEWORK
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.025em', margin: '2px 0 0' }}>
            Trade Setup & Validation Lab
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', margin: '4px 0 0' }}>
            Multi-dimensional pre-trade validation: Fed Macro, FDV Tokenomics, SMC Market Structure, & Coinglass CVD Confirmation.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={handleNewDraft}
            style={{ height: '34px', fontSize: '12px', padding: '0 12px' }}
          >
            <Plus size={14} />
            <span>New Draft</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSaveIdea}
            disabled={isSaving}
            style={{ height: '34px', fontSize: '12px', padding: '0 16px' }}
          >
            <Sparkles size={14} />
            <span>{isSaving ? 'Saving...' : selectedIdeaId ? 'Update Setup' : 'Save Setup'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Horizontal Queue Cards Track */}
      <div
        className="cardless-sheet"
        style={{
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          background: 'transparent',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={13} color="var(--color-accent-primary)" />
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
              PIPELINE QUEUE ({ideas.length} SAVED SETUPS)
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
            Click card to load or edit setup
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          {ideas.map((item) => {
            const isSelected = selectedIdeaId === item.id;
            const rInfo = item.entryPrice && item.stopLossPrice && item.tp1Price
              ? (Math.abs(item.tp1Price - item.entryPrice) / Math.abs(item.entryPrice - item.stopLossPrice)).toFixed(1)
              : null;
            const read = checkPillarReadiness(item);

            return (
              <div
                key={item.id}
                onClick={() => populateIdea(item)}
                style={{
                  minWidth: '200px',
                  maxWidth: '220px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected
                    ? '1px solid var(--color-accent-primary)'
                    : '1px solid var(--color-border)',
                  backgroundColor: isSelected
                    ? 'rgba(212, 175, 55, 0.06)'
                    : 'var(--color-bg-elevated)',
                  cursor: 'pointer',
                  transition: 'border-color var(--transition-fast), background-color var(--transition-fast), box-shadow var(--transition-fast)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  boxShadow: isSelected ? '0 0 14px rgba(212, 175, 55, 0.18)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="mono" style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                      {item.symbol}
                    </span>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: item.direction === 'LONG' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        color: item.direction === 'LONG' ? 'var(--color-bullish)' : 'var(--color-bearish)',
                        border: item.direction === 'LONG' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
                      }}
                    >
                      {item.direction}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteIdea(item.id, item.symbol, e)}
                    title="Delete this setup"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      padding: '2px',
                      borderRadius: '3px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-bearish)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {item.timeframe || '4H'} &bull; {item.status}
                  </span>
                  {rInfo && (
                    <span className="mono" style={{ color: 'var(--color-accent-primary)', fontWeight: 700 }}>
                      1:{rInfo}R
                    </span>
                  )}
                </div>

                {/* 4-Pillar Readiness Dots */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px', paddingTop: '4px', borderTop: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    PILAR: {read.count}/4
                  </span>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: read.p1 ? 'var(--color-cyan)' : 'var(--color-border)' }} title="Pilar 1: Makro" />
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: read.p2 ? 'var(--color-bullish)' : 'var(--color-border)' }} title="Pilar 2: Fundamental" />
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: read.p3 ? 'var(--color-amber)' : 'var(--color-border)' }} title="Pilar 3: Price Action" />
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: read.p4 ? '#ec4899' : 'var(--color-border)' }} title="Pilar 4: On-Chain Coinglass" />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Quick Create Card */}
          <div
            onClick={handleNewDraft}
            style={{
              minWidth: '120px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--color-border-accent)',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: 'var(--color-text-secondary)',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-accent-primary)';
              e.currentTarget.style.color = 'var(--color-accent-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border-accent)';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
          >
            <Plus size={18} />
            <span style={{ fontSize: '11px', fontWeight: 700 }}>+ Draft Baru</span>
          </div>
        </div>
      </div>

      {/* Setup Config Bar (High Density Terminal Controls) */}
      <div
        className="cardless-sheet"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          background: 'transparent',
          padding: '12px 16px',
          marginTop: '-4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          {/* Token Search Input with Dropdown */}
          <div ref={searchContainerRef} style={{ position: 'relative' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700, letterSpacing: '0.04em' }}>
              TOKEN / PAIR TICKER
            </span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="text"
                value={ticker}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setTicker(val);
                  setSearchQuery(val.replace('USDT', ''));
                }}
                className="form-input mono"
                style={{ width: '150px', height: '34px', fontSize: '13px', fontWeight: 800 }}
                placeholder="e.g. SOLUSDT"
              />
              <button
                className="btn btn-secondary"
                onClick={() => fetchFundamentalData(coinId)}
                title="Sync CoinGecko Data"
                style={{ height: '34px', padding: '0 10px', fontSize: '12px' }}
                disabled={isFetchingFundamental}
              >
                {isFetchingFundamental ? '...' : <Search size={14} />}
              </button>
            </div>

            {/* Dropdown Suggestions */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '260px',
                  backgroundColor: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border-accent)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.8)',
                  zIndex: 200,
                  marginTop: '4px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                }}
              >
                {searchResults.map((coin) => (
                  <div
                    key={coin.id}
                    onClick={() => handleSelectCoin(coin)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-overlay)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {coin.thumb && <img src={coin.thumb} alt={coin.name} style={{ width: 18, height: 18, borderRadius: '50%' }} />}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="mono" style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>{coin.symbol}</span>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{coin.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Direction Segmented Control */}
          <div>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700, letterSpacing: '0.04em' }}>
              TRADE DIRECTION
            </span>
            <div style={{ display: 'flex', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setDirection('LONG')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 14px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  backgroundColor: direction === 'LONG' ? 'var(--color-bullish)' : 'transparent',
                  color: direction === 'LONG' ? '#ffffff' : 'var(--color-text-secondary)',
                  boxShadow: direction === 'LONG' ? '0 0 10px rgba(16, 185, 129, 0.35)' : 'none',
                  transition: 'background-color var(--transition-fast), color var(--transition-fast), box-shadow var(--transition-fast)',
                }}
              >
                <TrendingUp size={13} />
                <span>LONG</span>
              </button>
              <button
                type="button"
                onClick={() => setDirection('SHORT')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 14px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  backgroundColor: direction === 'SHORT' ? 'var(--color-bearish)' : 'transparent',
                  color: direction === 'SHORT' ? '#ffffff' : 'var(--color-text-secondary)',
                  boxShadow: direction === 'SHORT' ? '0 0 10px rgba(244, 63, 94, 0.35)' : 'none',
                  transition: 'background-color var(--transition-fast), color var(--transition-fast), box-shadow var(--transition-fast)',
                }}
              >
                <TrendingDown size={13} />
                <span>SHORT</span>
              </button>
            </div>
          </div>

          {/* Timeframe Segmented Control */}
          <div>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700, letterSpacing: '0.04em' }}>
              TIMEFRAME ANALISIS
            </span>
            <div style={{ display: 'flex', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
              {['15M', '1H', '4H', '1D', '1W'].map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    backgroundColor: timeframe === tf ? 'var(--color-accent-primary)' : 'transparent',
                    color: timeframe === tf ? '#08080a' : 'var(--color-text-secondary)',
                    transition: 'background-color var(--transition-fast), color var(--transition-fast)',
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status Pipeline & Readiness Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700, letterSpacing: '0.04em' }}>
              STATUS WORKFLOW
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as IdeaStatus)}
              className="form-input mono"
              style={{ width: '150px', height: '34px', fontSize: '11px', fontWeight: 700, padding: '4px 10px' }}
            >
              <option value="WATCHLIST">WATCHLIST</option>
              <option value="READY">READY SETUP</option>
              <option value="ACTIVE">ACTIVE IN JOURNAL</option>
              <option value="CLOSED">CLOSED</option>
              <option value="INVALIDATED">INVALIDATED</option>
            </select>
          </div>

          <div>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700, letterSpacing: '0.04em' }}>
              READINESS SCORE
            </span>
            <div
              style={{
                height: '34px',
                padding: '0 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: currentReadiness.isComplete ? 'rgba(16, 185, 129, 0.12)' : 'rgba(212, 175, 55, 0.12)',
                border: currentReadiness.isComplete ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(212, 175, 55, 0.3)',
                color: currentReadiness.isComplete ? 'var(--color-bullish)' : 'var(--color-accent-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 800,
              }}
            >
              <CheckCircle2 size={13} />
              <span>{currentReadiness.count}/4 PILAR VALID</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pillars Grid Layout (Balanced 2x2 Terminal Grid) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(520px, 1fr))',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: 'transparent',
        }}
      >
        {/* PILAR 1: Makro Pasar & Fed Policy */}
        <div style={{ padding: '16px 20px', borderRight: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 26, height: 26, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-cyan-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={14} color="var(--color-cyan)" />
              </div>
              <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                1. Macro & Global Liquidity
              </h2>
            </div>
            <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 6px' }}>
              ● AUTO SYNC
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>
            Global liquidity conditions, Fed target rate trajectory, and DXY bias prior to execution.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              backgroundColor: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
            }}
          >
            <div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>FED TARGET RATE (EFFR)</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                <span className="value-number" style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>
                  {intel?.macro?.fedTargetRate || '3.75% - 4.00%'}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                  ({intel?.macro?.fedFundsRate?.value || 3.88}%)
                </span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>DXY DOLLAR INDEX</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                <span className="value-number" style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>
                  {intel?.forex?.dxy?.value?.toFixed(2) || '104.20'}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: (intel?.forex?.dxy?.change24h || 0) <= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)',
                  }}
                >
                  {(intel?.forex?.dxy?.change24h || 0) > 0 ? '+' : ''}{intel?.forex?.dxy?.change24h || -0.2}%
                </span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>CME FEDWATCH PROJECTION</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                <span className="value-number" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-bullish)' }}>
                  Pause {intel?.fedwatch?.noChangeProb || 82.8}%
                </span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                  | Hike {intel?.fedwatch?.hikeProb || 17.2}%
                </span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>NEXT FOMC MEETING</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                <span className="mono" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-cyan)' }}>
                  {intel?.macro?.nextFomcDate || '28 Okt 2026'}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                  ({intel?.macro?.fomcDaysRemaining ?? 8} days)
                </span>
              </div>
            </div>
          </div>

          {/* BTC Production Cost Context if analyzing BTC */}
          {isBtcSetup && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: 'rgba(234, 179, 8, 0.08)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(234, 179, 8, 0.25)',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: '#facc15' }}>BTC Mining Floor Benchmark:</span>
                <span className="mono" style={{ color: 'var(--color-bullish)', fontWeight: 700 }}>+38.4% Premium</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', fontSize: '10px' }}>
                <span>Est. Production Cost: <strong className="mono" style={{ color: '#fff' }}>${btcCost.toLocaleString()}</strong></span>
                <span>Market Price: <strong className="mono" style={{ color: '#fff' }}>${btcPrice.toLocaleString()}</strong></span>
              </div>
            </div>
          )}

          {/* Market Regime Segmented Selector */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Select Market Regime:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['RISK_ON', 'RISK_OFF', 'NEUTRAL'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setMacroRegime(r)}
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: macroRegime === r ? 'var(--color-cyan-dim)' : 'transparent',
                    color: macroRegime === r ? 'var(--color-cyan)' : 'var(--color-text-secondary)',
                    borderColor: macroRegime === r ? 'var(--color-cyan-border)' : 'var(--color-border)',
                    cursor: 'pointer',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <textarea
            className="form-textarea"
            rows={2}
            value={macroNotes}
            onChange={(e) => setMacroNotes(e.target.value)}
            placeholder="Macro regime personal notes (FOMC bias, DXY resistance, global liquidity flows)..."
            style={{ marginTop: 'auto', fontSize: '11px', minHeight: '52px' }}
          />
        </div>

        {/* PILAR 2: Fundamental & Tokenomics */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 26, height: 26, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-bullish-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Coins size={14} color="var(--color-bullish)" />
              </div>
              <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                2. Fundamentals & Tokenomics
              </h2>
            </div>
            <span className="neutral-badge" style={{ fontSize: '9px', padding: '1px 6px' }}>
              HYBRID API
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>
            FDV valuation, circulating supply, volume turnover, and cliff token unlock overhang risk.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              backgroundColor: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
            }}
          >
            <div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>CURRENT MARKET PRICE</span>
              <div style={{ marginTop: '2px' }}>
                <DualCurrencyValue usd={fundamentalData.currentPriceUsd} layout="row" />
              </div>
            </div>

            <div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>FDV / MCAP RATIO</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span
                  className={fundamentalData.fdvToMcapRatio > 2.0 ? 'bearish-badge' : 'bullish-badge'}
                  style={{ fontSize: '10px', padding: '1px 6px' }}
                >
                  {fundamentalData.fdvToMcapRatio}x
                </span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                  {fundamentalData.fdvToMcapRatio > 2.0 ? 'Cliff Risk' : 'Healthy Supply'}
                </span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>MARKET CAP (USD)</span>
              <span className="value-number" style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
                {formatCompactUsd(fundamentalData.marketCapUsd)}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>FULLY DILUTED (FDV)</span>
              <span className="value-number" style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
                {formatCompactUsd(fundamentalData.fdvUsd)}
              </span>
            </div>
          </div>

          {/* Visual Dilution Gap Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Dilution Gap (Circulating Supply):</span>
              <span className="mono" style={{ color: '#fff', fontWeight: 700 }}>
                {dilutionCirculatingPercent}% Circulating ({100 - dilutionCirculatingPercent}% Future Dilution)
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-bg-elevated)', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
              <div
                style={{
                  width: `${dilutionCirculatingPercent}%`,
                  backgroundColor: 'var(--color-bullish)',
                  transition: 'width 0.3s ease',
                }}
              />
              <div
                style={{
                  width: `${100 - dilutionCirculatingPercent}%`,
                  backgroundColor: fundamentalData.fdvToMcapRatio > 2.0 ? 'var(--color-bearish)' : 'rgba(255,255,255,0.1)',
                }}
              />
            </div>
          </div>

          <textarea
            className="form-textarea"
            rows={2}
            value={fundamentalNotes}
            onChange={(e) => setFundamentalNotes(e.target.value)}
            placeholder="Token unlock schedule notes, investor vesting, chain metrics & TVL..."
            style={{ marginTop: 'auto', fontSize: '11px', minHeight: '52px' }}
          />
        </div>

        {/* PILAR 3: Price Action & Risk-Reward Engine */}
        <div style={{ padding: '16px 20px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 26, height: 26, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-amber-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={14} color="var(--color-amber)" />
              </div>
              <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                3. Price Action (TradingView)
              </h2>
            </div>
            <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 6px' }}>
              LIVE R:R CALC
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>
            SMC/ICT market structure, liquidity sweeps, order blocks, and risk/reward dynamics.
          </p>

          {/* Market Structure Segmented Selector */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Market Structure:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['BULLISH_BOS', 'BEARISH_BOS', 'CHoCH', 'RANGE'] as const).map((ms) => (
                <button
                  key={ms}
                  type="button"
                  onClick={() => setMarketStructure(ms)}
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: marketStructure === ms ? 'var(--color-amber-dim)' : 'transparent',
                    color: marketStructure === ms ? 'var(--color-amber)' : 'var(--color-text-secondary)',
                    borderColor: marketStructure === ms ? 'var(--color-amber-border)' : 'var(--color-border)',
                    cursor: 'pointer',
                  }}
                >
                  {ms.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* 3-Column Execution Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px', fontWeight: 700 }}>
                ENTRY PRICE
              </label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                className="form-input mono"
                style={{ height: '34px', fontSize: '12px', padding: '4px 8px', borderColor: 'var(--color-cyan-border)' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '2px', fontWeight: 700 }}>
                  STOP LOSS
                </label>
                {rrInfo.slPercent > 0 && (
                  <span className="mono bearish-text" style={{ fontSize: '9px', fontWeight: 700 }}>
                    -{rrInfo.slPercent.toFixed(1)}%
                  </span>
                )}
              </div>
              <input
                type="number"
                step="any"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(parseFloat(e.target.value) || 0)}
                className="form-input mono"
                style={{ height: '34px', fontSize: '12px', padding: '4px 8px', borderColor: 'var(--color-bearish-border)' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '2px', fontWeight: 700 }}>
                  TARGET (TP1)
                </label>
                {rrInfo.tpPercent > 0 && (
                  <span className="mono bullish-text" style={{ fontSize: '9px', fontWeight: 700 }}>
                    +{rrInfo.tpPercent.toFixed(1)}%
                  </span>
                )}
              </div>
              <input
                type="number"
                step="any"
                value={tp1Price}
                onChange={(e) => setTp1Price(parseFloat(e.target.value) || 0)}
                className="form-input mono"
                style={{ height: '34px', fontSize: '12px', padding: '4px 8px', borderColor: 'var(--color-bullish-border)' }}
              />
            </div>
          </div>

          {/* Dynamic Visual Risk-Reward Bar */}
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Risk to Reward Ratio:
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span
                  className="value-number"
                  style={{
                    fontSize: '16px',
                    fontWeight: 900,
                    color: rrInfo.rrRatio >= 2.0 ? 'var(--color-accent-primary)' : rrInfo.rrRatio >= 1.5 ? 'var(--color-amber)' : 'var(--color-bearish)',
                  }}
                >
                  1 : {rrInfo.rrRatio} R
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '3px',
                    backgroundColor: rrInfo.rrRatio >= 2.0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                    color: rrInfo.rrRatio >= 2.0 ? 'var(--color-bullish)' : 'var(--color-amber)',
                  }}
                >
                  {rrInfo.rrRatio >= 2.0 ? 'Optimal Setup' : rrInfo.rrRatio >= 1.0 ? 'Fair R:R' : 'Suboptimal'}
                </span>
              </div>
            </div>

            {/* Proportional R:R Bar */}
            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-bg-elevated)', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: '25%', backgroundColor: 'var(--color-bearish)' }} title="1 Unit Risk" />
              <div
                style={{
                  width: `${Math.min(75, Math.max(10, rrInfo.rrRatio * 25))}%`,
                  backgroundColor: 'var(--color-bullish)',
                  transition: 'width 0.3s ease',
                }}
                title={`${rrInfo.rrRatio} Units Reward`}
              />
            </div>
          </div>

          {rrInfo.warning && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-bearish)', fontSize: '11px', fontWeight: 600 }}>
              <AlertTriangle size={13} />
              <span>{rrInfo.warning}</span>
            </div>
          )}

          {/* Confluence Factors Tag Pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700 }}>
              TECHNICAL CONFLUENCES:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {confluences.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveConfluence(tag)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <form onSubmit={handleAddConfluence} style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
              <input
                type="text"
                value={newConfluenceInput}
                onChange={(e) => setNewConfluenceInput(e.target.value)}
                placeholder="+ Add confluence tag (e.g. 4H FVG retest)..."
                className="form-input"
                style={{ height: '28px', fontSize: '10px', padding: '2px 8px' }}
              />
            </form>
          </div>

          <textarea
            className="form-textarea"
            rows={2}
            value={priceActionNotes}
            onChange={(e) => setPriceActionNotes(e.target.value)}
            placeholder="TradingView chart link, imbalance FVG, equilibrium..."
            style={{ marginTop: 'auto', fontSize: '11px', minHeight: '52px' }}
          />
        </div>

        {/* PILAR 4: Bukti On-Chain & Coinglass Hub */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 26, height: 26, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(236, 72, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={14} color="#ec4899" />
              </div>
              <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                4. On-Chain & Coinglass Evidence
              </h2>
            </div>
            <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 6px' }}>
              INDEXEDDB STORAGE
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>
            Paste chart analysis screenshots (<kbd style={{ padding: '1px 4px', background: 'var(--color-border)', borderRadius: '3px' }}>Ctrl + V</kbd>) saved directly to local browser IndexedDB.
          </p>

          {/* Paste & Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--color-border-accent)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              textAlign: 'center',
              backgroundColor: 'var(--color-bg-subtle)',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleSaveBlobScreenshot(e.dataTransfer.files[0]);
              }
            }}
          >
            <Upload size={18} color="var(--color-accent-primary)" style={{ margin: '0 auto 4px' }} />
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block' }}>
              Press <strong style={{ color: 'var(--color-accent-primary)' }}>Ctrl + V</strong> anywhere or click to upload chart screenshot
            </span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>

          {/* Screenshot Thumbnails Gallery */}
          {screenshots.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 0' }}>
              {screenshots.map((ss) => (
                <div
                  key={ss.id}
                  style={{
                    position: 'relative',
                    width: '64px',
                    height: '48px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    border: '1px solid var(--color-border)',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={ss.url}
                    alt="Evidence"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => setPreviewImageUrl(ss.url)}
                  />
                  <button
                    onClick={() => handleDeleteScreenshot(ss.id)}
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: 'rgba(0,0,0,0.7)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      color: 'var(--color-bearish)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Coinglass Onchain Checklists */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '6px',
              backgroundColor: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 10px',
            }}
          >
            <div>
              <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>OI TREND</span>
              <select
                value={oiTrend}
                onChange={(e) => setOiTrend(e.target.value as any)}
                className="form-input"
                style={{ fontSize: '10px', padding: '2px 4px', height: '26px' }}
              >
                <option value="INCREASING">Increasing</option>
                <option value="DECREASING">Decreasing</option>
                <option value="STABLE">Stable</option>
              </select>
            </div>

            <div>
              <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>FUNDING RATE</span>
              <select
                value={fundingRateStatus}
                onChange={(e) => setFundingRateStatus(e.target.value as any)}
                className="form-input"
                style={{ fontSize: '10px', padding: '2px 4px', height: '26px' }}
              >
                <option value="HEALTHY">Healthy (0.01%)</option>
                <option value="POSITIVE_EXTREME">Extreme Longs</option>
                <option value="NEGATIVE_EXTREME">Extreme Shorts</option>
              </select>
            </div>

            <div>
              <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>CVD DELTA</span>
              <select
                value={cvdDivergence}
                onChange={(e) => setCvdDivergence(e.target.value as any)}
                className="form-input"
                style={{ fontSize: '10px', padding: '2px 4px', height: '26px' }}
              >
                <option value="BULLISH_DIV">Bullish Div</option>
                <option value="BEARISH_DIV">Bearish Div</option>
                <option value="CONVERGENT">Convergent</option>
              </select>
            </div>
          </div>

          <textarea
            className="form-textarea"
            rows={2}
            value={evidenceNotes}
            onChange={(e) => setEvidenceNotes(e.target.value)}
            placeholder="Coinglass liquidation levels, heatmap clusters, CVD spot divergence notes..."
            style={{ marginTop: 'auto', fontSize: '11px', minHeight: '52px' }}
          />
        </div>
      </div>

      {/* Floating Cockpit Execution Dock (Pinned at Bottom) */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 'var(--sidebar-width)',
          right: 0,
          backgroundColor: 'rgba(14, 14, 19, 0.95)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--color-border-accent)',
          padding: '10px 24px',
          zIndex: 50,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="mono" style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff' }}>
              {ticker}
            </span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '3px',
                backgroundColor: direction === 'LONG' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                color: direction === 'LONG' ? 'var(--color-bullish)' : 'var(--color-bearish)',
              }}
            >
              {direction} {timeframe}
            </span>
          </div>

          <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--color-border)' }} />

          <div>
            <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', display: 'block' }}>ENTRY</span>
            <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
              ${entryPrice.toLocaleString()}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', display: 'block' }}>STOP LOSS</span>
            <span className="mono bearish-text" style={{ fontSize: '13px', fontWeight: 700 }}>
              ${stopLossPrice.toLocaleString()}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', display: 'block' }}>TARGET (TP1)</span>
            <span className="mono bullish-text" style={{ fontSize: '13px', fontWeight: 700 }}>
              ${tp1Price.toLocaleString()}
            </span>
          </div>

          <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--color-border)' }} />

          <div>
            <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', display: 'block' }}>RISK : REWARD</span>
            <span
              className="mono"
              style={{
                fontSize: '15px',
                fontWeight: 900,
                color: rrInfo.rrRatio >= 2.0 ? 'var(--color-accent-primary)' : 'var(--color-amber)',
              }}
            >
              1 : {rrInfo.rrRatio} R
            </span>
          </div>

          <div
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: currentReadiness.isComplete ? 'rgba(16, 185, 129, 0.15)' : 'rgba(212, 175, 55, 0.15)',
              color: currentReadiness.isComplete ? 'var(--color-bullish)' : 'var(--color-accent-primary)',
              fontSize: '10px',
              fontWeight: 800,
            }}
          >
            ● {currentReadiness.count}/4 PILLARS
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={handleNavigateToCalculator}
            style={{ height: '34px', fontSize: '12px', padding: '0 12px' }}
            title="Send setup to Risk Calculator & Position Sizer"
          >
            <Calculator size={14} />
            <span>Position Sizer</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleSaveIdea}
            disabled={isSaving}
            style={{ height: '34px', fontSize: '12px', padding: '0 14px' }}
          >
            <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={handleTransferToJournal}
            disabled={isTransferring}
            style={{ height: '34px', fontSize: '12px', padding: '0 16px', fontWeight: 800 }}
          >
            <span>{isTransferring ? 'Dispatching...' : 'Dispatch to Trade Journal'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
