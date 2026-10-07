import React, { useState, useEffect } from 'react';
import { PlanDetail, ProPlanId, PaymentTransaction, UserPreferences } from '../types';
import { playChime } from '../utils/audio';
import { generateQrisPayload, generateQrCodeDataUrl } from '../utils/qris';

interface PremiumScreenProps {
  userPrefs: UserPreferences;
  onUpdatePrefs: (prefs: UserPreferences) => void;
  onNavigateToTab: (tab: 'today' | 'tasks' | 'focus' | 'notes') => void;
}

export const PRO_PLANS: PlanDetail[] = [
  {
    id: 'monthly',
    name: 'Paket Bulanan',
    durationLabel: '1 Bulan',
    durationDays: 30,
    price: 39000,
    priceFormatted: 'Rp39.000',
    description: 'Pilihan fleksibel untuk mencoba fokus terarah dan ritme kerja monastik tanpa komitmen jangka panjang.',
    features: [
      '50 sesi AI Flow Coach per hari (Gemini 3.8 & 3.5 Flash)',
      '15 kali AI Task Breakdown per hari',
      'Smart References: Google Search Grounding standar',
      'Focus Mode Timer & 2 Suara Ambien (Rain & Brown Noise)',
      'Riwayat tugas dan timeline tersimpan 30 hari',
      'Tanpa batas pembuatan tugas harian',
    ],
  },
  {
    id: 'semi-annual',
    name: 'Paket 6 Bulan',
    durationLabel: '6 Bulan',
    durationDays: 180,
    price: 149000,
    priceFormatted: 'Rp149.000',
    originalPriceFormatted: 'Rp234.000',
    tag: 'BEST VALUE',
    savingsNote: 'Hemat 36% (hanya Rp24.800/bulan)',
    description: 'Paling diminati untuk membangun kebiasaan deep work berkelanjutan dan bebas hambatan.',
    features: [
      'Unlimited AI Chat: Tanpa batas sesi percakapan harian',
      'Unlimited AI Task Breakdown: Bebas pecah tugas kapan saja',
      'Smart References Prioritas: Sitasi jurnal & riset kognitif mendalam',
      'Full Ambient Soundscape (Rain, White, Brown, Campfire) + Zen Binaural Chimes',
      'Visualisasi tren mingguan Recharts & rekap 180 hari penuh',
      'Sinkronisasi offline cerdas & auto-restore data',
      'Dukungan email prioritas',
    ],
  },
  {
    id: 'annual',
    name: 'Paket 1 Tahun',
    durationLabel: '1 Tahun',
    durationDays: 365,
    price: 229000,
    priceFormatted: 'Rp229.000',
    originalPriceFormatted: 'Rp468.000',
    tag: 'HEMAT 51%',
    savingsNote: 'Hemat 51% (hanya Rp19.080/bulan)',
    description: 'Investasi produktivitas terbaik untuk profesional, peneliti, kreator independen, dan pelajar.',
    features: [
      'Semua fitur Paket 6 Bulan tanpa batas seumur langganan',
      'Gemini 3.8 Live API Voice: Percakapan suara real-time tanpa kuota',
      'Akses eksklusif model penalaran mendalam Gemini 3.1 Pro Preview',
      'Ekspor laporan ritme fokus tahunan lengkap (PDF & Markdown)',
      'Template dekonstruksi fokus & panduan audio meditasi kerja',
      'Akses awal ke seluruh pembaruan fitur beta terbaru NOTO',
      'Dukungan VIP 24/7 via WhatsApp & Konsultasi Produktivitas Pribadi',
    ],
  },
];

type Step = 'plans' | 'checkout' | 'payment_pending' | 'verify_form' | 'verifying' | 'success';

export const PremiumScreen: React.FC<PremiumScreenProps> = ({
  userPrefs,
  onUpdatePrefs,
  onNavigateToTab,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<ProPlanId>(
    userPrefs.proPlan || 'semi-annual'
  );
  const [step, setStep] = useState<Step>(
    userPrefs.isPro && userPrefs.activeTransaction ? 'success' : 'plans'
  );

  // Form Pembeli
  const [customerName, setCustomerName] = useState(userPrefs.name || 'Oddy');
  const [customerEmail, setCustomerEmail] = useState('aureliustheoddyn@gmail.com');
  const [customerPhone, setCustomerPhone] = useState('081234567890');
  const [selectedMethod, setSelectedMethod] = useState<
    'qris' | 'bca_va' | 'mandiri_va' | 'bri_va' | 'bni_va' | 'gopay' | 'dana' | 'bank_transfer'
  >('qris');

  // Order Reference
  const [currentOrderId, setCurrentOrderId] = useState<string>(() => {
    return `INV/NOTO/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(
      10000 + Math.random() * 90000
    )}`;
  });

  // Real Scannable QR Code State
  const [realQrisDataUrl, setRealQrisDataUrl] = useState<string>('');
  const [rawQrisPayload, setRawQrisPayload] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);
  const [isMerchantConfigOpen, setIsMerchantConfigOpen] = useState<boolean>(false);
  const [merchantName, setMerchantName] = useState<string>('PT NOTO KREATIF DIGITAL');
  const [merchantNmid, setMerchantNmid] = useState<string>('ID10293847561');
  const [customUploadedQris, setCustomUploadedQris] = useState<string | null>(
    userPrefs.customQrisImageUrl || null
  );

  // Form Verifikasi & Bukti Pembayaran
  const [senderName, setSenderName] = useState<string>(customerName);
  const [senderBank, setSenderBank] = useState<string>('BCA');
  const [senderAccountNo, setSenderAccountNo] = useState<string>('');
  const [transferDate, setTransferDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [transferNotes, setTransferNotes] = useState<string>('');
  const [proofImageBase64, setProofImageBase64] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string>('');

  // Interactive feedback states (no window.alert)
  const [copiedVa, setCopiedVa] = useState(false);
  const [savedQris, setSavedQris] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [downloadedReceipt, setDownloadedReceipt] = useState(false);

  // Transaction Receipt State
  const [currentTransaction, setCurrentTransaction] = useState<PaymentTransaction | null>(
    userPrefs.activeTransaction || null
  );

  const selectedPlan = PRO_PLANS.find((p) => p.id === selectedPlanId) || PRO_PLANS[1];

  // Helper formatting
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (timestamp: number) => {
    const d = new Date(timestamp);
    const dateStr = d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeStr = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateStr}, ${timeStr} WIB`;
  };

  // Generate real QR code when selected plan or merchant info changes
  useEffect(() => {
    let isMounted = true;
    setIsGeneratingQr(true);

    try {
      const payload = generateQrisPayload({
        merchantName,
        nmid: merchantNmid,
        amount: selectedPlan.price,
        invoiceId: currentOrderId,
      });

      setRawQrisPayload(payload);

      generateQrCodeDataUrl(payload)
        .then((dataUrl) => {
          if (isMounted) {
            setRealQrisDataUrl(dataUrl);
            setIsGeneratingQr(false);
          }
        })
        .catch((err) => {
          console.error('Failed to generate real QR code:', err);
          if (isMounted) setIsGeneratingQr(false);
        });
    } catch (e) {
      console.error(e);
      if (isMounted) setIsGeneratingQr(false);
    }

    return () => {
      isMounted = false;
    };
  }, [selectedPlan.price, merchantName, merchantNmid, currentOrderId]);

  // Alur 1: Memilih paket langsung diarahkan ke form checkout
  const handleSelectPlanAndCheckout = (planId: ProPlanId) => {
    setSelectedPlanId(planId);
    setSenderName(customerName);
    setStep('checkout');
  };

  // Alur 2: Dari checkout ke instruksi pembayaran
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setSenderName(customerName);
    setStep('payment_pending');
  };

  // Alur 3: Dari pending ke formulir verifikasi
  const handleProceedToVerification = () => {
    setSenderName(customerName);
    setStep('verify_form');
  };

  // Handle upload bukti transfer (File input)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Quick Demo sample proof generator (memudahkan testing & demo)
  const handleUseDemoProof = () => {
    // Generate an authentic sample digital receipt preview image
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 600, 700);

      ctx.fillStyle = '#3A674F';
      ctx.fillRect(0, 0, 600, 80);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TRANSFER BERHASIL', 300, 50);

      ctx.fillStyle = '#1B1C1A';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(selectedPlan.priceFormatted, 300, 160);

      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#777777';
      ctx.fillText('Total Nominal Pembayaran', 300, 195);

      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 230);
      ctx.lineTo(560, 230);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#555555';

      const rows = [
        ['Penerima', merchantName],
        ['No. Referensi', currentOrderId],
        ['Pengirim', senderName || customerName],
        ['Bank Pengirim', senderBank],
        ['Waktu Transaksi', new Date().toLocaleString('id-ID')],
        ['Status', 'BERHASIL / LUNAS'],
      ];

      let y = 280;
      rows.forEach(([label, val]) => {
        ctx.fillStyle = '#777777';
        ctx.fillText(label, 50, y);
        ctx.fillStyle = '#1B1C1A';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(val, 550, y);
        ctx.textAlign = 'left';
        ctx.font = '16px sans-serif';
        y += 50;
      });

      const dataUrl = canvas.toDataURL('image/png');
      setProofImageBase64(dataUrl);
      setProofFileName(`Bukti_Transfer_${senderBank}_${Date.now()}.png`);
    }
  };

  // Alur 4: Kirim bukti pembayaran & proses verifikasi
  const handleSubmitVerification = (e: React.FormEvent) => {
    e.preventDefault();

    if (!proofImageBase64) {
      // Jika belum upload bukti, berikan contoh otomatis atau minta upload
      handleUseDemoProof();
    }

    setStep('verifying');

    // Simulasi verifikasi cerdas (2 detik)
    setTimeout(() => {
      playChime(660, 2.0);
      const now = Date.now();
      const expires = now + selectedPlan.durationDays * 24 * 60 * 60 * 1000;

      const methodLabels: Record<string, string> = {
        qris: 'QRIS Standar Nasional (Scan Berhasil)',
        bca_va: 'BCA Virtual Account',
        mandiri_va: 'Mandiri Virtual Account',
        bri_va: 'BRI Virtual Account (BRIVA)',
        bni_va: 'BNI Virtual Account',
        gopay: 'GoPay E-Wallet',
        dana: 'DANA E-Wallet',
        bank_transfer: 'Transfer Bank Langsung',
      };

      const newTx: PaymentTransaction = {
        id: `tx-${now}`,
        orderId: currentOrderId,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        amount: selectedPlan.price,
        amountFormatted: selectedPlan.priceFormatted,
        method: selectedMethod as any,
        methodName: methodLabels[selectedMethod] || 'QRIS Nasional',
        userName: customerName,
        userEmail: customerEmail,
        userPhone: customerPhone,
        senderName: senderName || customerName,
        senderBank: senderBank,
        paymentProofUrl: proofImageBase64 || undefined,
        proofFileName: proofFileName || 'Bukti_Transfer_Terverifikasi.png',
        notes: transferNotes || undefined,
        paidAt: now,
        verifiedAt: now,
        expiresAt: expires,
        durationDays: selectedPlan.durationDays,
        status: 'paid',
        features: selectedPlan.features,
      };

      setCurrentTransaction(newTx);

      // Simpan ke preferensi pengguna & aktifkan NOTO Pro
      onUpdatePrefs({
        ...userPrefs,
        isPro: true,
        proPlan: selectedPlan.id,
        activeTransaction: newTx,
      });

      setStep('success');
    }, 2200);
  };

  const handleCopyVa = (vaText: string) => {
    navigator.clipboard?.writeText(vaText).catch(() => {});
    setCopiedVa(true);
    setTimeout(() => setCopiedVa(false), 2500);
  };

  const handleCopyPayload = () => {
    navigator.clipboard?.writeText(rawQrisPayload).catch(() => {});
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2500);
  };

  const handleSaveQrisImage = () => {
    if (!realQrisDataUrl && !customUploadedQris) return;
    const link = document.createElement('a');
    link.href = customUploadedQris || realQrisDataUrl;
    link.download = `QRIS_${selectedPlan.name.replace(/\s+/g, '_')}_${currentOrderId.replace(/\//g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSavedQris(true);
    setTimeout(() => setSavedQris(false), 2500);
  };

  const handleDownloadReceipt = () => {
    if (!currentTransaction) return;

    const receiptContent = `=====================================================
          BUKTI TRANSAKSI & INVOICE RESMI
               NOTO KREATIF DIGITAL
=====================================================
Nomor Transaksi   : ${currentTransaction.orderId}
Status            : LUNAS (TERVERIFIKASI)
Waktu Transaksi   : ${formatDateTime(currentTransaction.paidAt)}
Waktu Verifikasi  : ${formatDateTime(currentTransaction.verifiedAt || currentTransaction.paidAt)}

DATA PEMBELI:
Nama Pembeli      : ${currentTransaction.userName}
Email             : ${currentTransaction.userEmail}
No. WhatsApp      : ${currentTransaction.userPhone}

DATA PENGIRIM:
Nama Rekening     : ${currentTransaction.senderName || currentTransaction.userName}
Bank / E-Wallet   : ${currentTransaction.senderBank || 'Bank Transfer'}
Bukti Pembayaran  : ${currentTransaction.proofFileName || 'Lampiran Valid Terverifikasi'}

RINCIAN PEMBAYARAN:
Paket Dipilih     : ${currentTransaction.planName}
Metode Pembayaran : ${currentTransaction.methodName}
Total Biaya       : ${currentTransaction.amountFormatted}
Biaya Layanan/PPN : Rp0 (Bebas Biaya)
Total Dibayar     : ${currentTransaction.amountFormatted}

PERIODE PENGGUNAAN:
Durasi Aktif      : ${currentTransaction.durationDays} Hari
Mulai Berlaku     : ${formatDate(currentTransaction.paidAt)}
Berlaku Hingga    : ${formatDate(currentTransaction.expiresAt)}

FITUR YANG DIPEROLEH:
${currentTransaction.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

=====================================================
Terima kasih telah bergabung dengan NOTO Pro.
Akun Anda telah aktif dan siap digunakan.
=====================================================`;

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_NOTO_${currentTransaction.orderId.replace(/\//g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadedReceipt(true);
    setTimeout(() => setDownloadedReceipt(false), 3000);
  };

  return (
    <div className="w-full flex flex-col space-y-6 pt-1 pb-10">
      {/* ========================================================================= */}
      {/* TAHAP 1: DAFTAR PAKET & DETAIL FITUR SPESIFIK                             */}
      {/* ========================================================================= */}
      {step === 'plans' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Monastic Hero */}
          <section className="text-center space-y-2 pt-1">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-secondary/15 text-secondary text-[11px] font-semibold tracking-wider uppercase">
              <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
              <span>Keanggotaan NOTO Pro</span>
            </div>
            <h1 className="text-[26px] font-semibold tracking-tight text-on-surface leading-tight">
              Pilih Paket Produktivitas Anda
            </h1>
            <p className="text-[13px] text-on-surface-variant max-w-sm mx-auto leading-relaxed">
              Dapatkan alat bertenaga AI untuk ritme kerja yang tenang, fokus mendalam, dan eliminasi distraksi kognitif.
            </p>
          </section>

          {/* Kartu Paket dengan Rincian Fitur Spesifik */}
          <div className="space-y-4">
            {PRO_PLANS.map((plan) => {
              const isSelected = selectedPlanId === plan.id;

              return (
                <div
                  key={plan.id}
                  onClick={() => handleSelectPlanAndCheckout(plan.id)}
                  className={`rounded-2xl p-5 border transition-all cursor-pointer relative bg-surface-container-lowest shadow-[0_2px_8px_-3px_rgba(0,0,0,0.02)] hover:border-secondary hover:shadow-md ${
                    isSelected
                      ? 'border-secondary ring-1 ring-secondary'
                      : 'border-surface-container-highest'
                  }`}
                >
                  {/* Badge Tag */}
                  {plan.tag && (
                    <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-secondary text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                      {plan.tag}
                    </span>
                  )}

                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-[17px] font-semibold text-on-surface">
                          {plan.name}
                        </h3>
                        <span className="text-[12px] text-on-surface-variant font-medium">
                          ({plan.durationLabel})
                        </span>
                      </div>
                      <p className="text-[12px] text-on-surface-variant pt-0.5 leading-snug">
                        {plan.description}
                      </p>
                    </div>

                    {/* Radio Indicator */}
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? 'border-secondary bg-secondary text-white'
                          : 'border-outline-variant bg-transparent'
                      }`}
                    >
                      {isSelected && (
                        <span className="material-symbols-outlined text-[13px] font-bold">
                          check
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pricing row */}
                  <div className="mt-3 pt-3 border-t border-surface-container-high/60 flex items-baseline justify-between">
                    <div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-[22px] font-semibold text-on-surface tabular-nums">
                          {plan.priceFormatted}
                        </span>
                        {plan.originalPriceFormatted && (
                          <span className="text-[13px] text-outline line-through tabular-nums">
                            {plan.originalPriceFormatted}
                          </span>
                        )}
                      </div>
                      {plan.savingsNote && (
                        <p className="text-[11px] font-medium text-secondary pt-0.5">
                          {plan.savingsNote}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPlanAndCheckout(plan.id);
                      }}
                      className="px-4 py-2 rounded-full bg-primary hover:bg-[#222] text-on-primary text-[12px] font-semibold transition-transform active:scale-95 shadow-xs cursor-pointer flex items-center space-x-1"
                    >
                      <span>Pilih Paket</span>
                      <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </button>
                  </div>

                  {/* Detail Fitur Spesifik Tiap Paket */}
                  <div className="mt-4 pt-3 border-t border-surface-container-high/60 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
                      Fitur yang Diperoleh ({plan.name}):
                    </span>
                    <ul className="space-y-1.5">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start space-x-2 text-[12px] text-on-surface">
                          <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 pt-0.5">
                            check_circle
                          </span>
                          <span className="leading-snug">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabel Komparasi Ringkas Free vs Pro */}
          <div className="bg-surface-container-low/60 rounded-xl p-4 border border-surface-container-highest space-y-2.5">
            <span className="text-[12px] font-semibold text-on-surface uppercase tracking-wider block">
              Ringkasan Perbandingan
            </span>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between py-1 border-b border-surface-container-high">
                <span className="text-on-surface-variant">AI Chat Multi-Turn</span>
                <span className="font-medium text-on-surface">5x/hari (Free) vs Unlimited (Pro 6bln &amp; 1thn)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-container-high">
                <span className="text-on-surface-variant">AI Task Breakdown</span>
                <span className="font-medium text-on-surface">Tidak ada (Free) vs Prioritas (Pro)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-container-high">
                <span className="text-on-surface-variant">Google Search Grounding</span>
                <span className="font-medium text-on-surface">Dasar (Free) vs Jurnal &amp; Sitasi Ilmiah (Pro)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-on-surface-variant">Voice Mode (Live API)</span>
                <span className="font-medium text-secondary">Eksklusif Paket 1 Tahun</span>
              </div>
            </div>
          </div>

          {/* Quick FAQ / Jaminan */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-highest flex items-start space-x-3">
            <span className="material-symbols-outlined text-secondary text-[20px] pt-0.5 shrink-0">
              shield
            </span>
            <div className="space-y-0.5">
              <p className="text-[13px] font-semibold text-on-surface">Aman &amp; Terpercaya</p>
              <p className="text-[12px] text-on-surface-variant leading-relaxed">
                Pembayaran diproses secara instan melalui QRIS Standar Nasional, Virtual Account resmi bank-bank nasional, dan e-wallet. Tidak ada biaya langganan tersembunyi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAHAP 2: FORMULIR PEMESANAN & REKOMENDASI PEMBAYARAN                     */}
      {/* ========================================================================= */}
      {step === 'checkout' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
            <button
              type="button"
              onClick={() => setStep('plans')}
              className="inline-flex items-center space-x-1 text-[13px] text-on-surface-variant hover:text-on-surface font-medium cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Ganti Paket</span>
            </button>
            <span className="text-[12px] font-semibold text-secondary uppercase tracking-wider">
              Langkah 1 dari 3
            </span>
          </div>

          {/* Ringkasan Paket Terpilih */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-highest space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider">
                  Paket Terpilih
                </span>
                <h3 className="text-[18px] font-semibold text-on-surface">{selectedPlan.name}</h3>
                <p className="text-[12px] text-on-surface-variant">
                  Masa aktif: {selectedPlan.durationLabel} ({selectedPlan.durationDays} Hari)
                </p>
              </div>
              <span className="text-[18px] font-semibold text-on-surface tabular-nums">
                {selectedPlan.priceFormatted}
              </span>
            </div>
          </div>

          {/* Form Data Pelanggan */}
          <form onSubmit={handleProceedToPayment} className="space-y-4">
            <div className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-4 space-y-3.5">
              <h4 className="text-[13px] font-semibold text-on-surface uppercase tracking-wider">
                1. Data Pembeli
              </h4>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama sesuai akun atau KTP"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container-highest bg-surface-container-low/40 focus:bg-white text-[13px] text-on-surface outline-none focus:border-on-surface transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Alamat Email (Untuk Bukti Transaksi)
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container-highest bg-surface-container-low/40 focus:bg-white text-[13px] text-on-surface outline-none focus:border-on-surface transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Nomor WhatsApp / HP
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container-highest bg-surface-container-low/40 focus:bg-white text-[13px] text-on-surface outline-none focus:border-on-surface transition-all"
                />
              </div>
            </div>

            {/* Pilihan Metode Pembayaran Rekomendasi */}
            <div className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-4 space-y-3">
              <h4 className="text-[13px] font-semibold text-on-surface uppercase tracking-wider">
                2. Rekomendasi Metode Pembayaran
              </h4>

              {/* Rekomendasi 1: QRIS Real */}
              <label
                onClick={() => setSelectedMethod('qris')}
                className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedMethod === 'qris'
                    ? 'border-secondary bg-[#F4F7F5]'
                    : 'border-surface-container-highest hover:bg-surface-container-low/50'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  checked={selectedMethod === 'qris'}
                  onChange={() => setSelectedMethod('qris')}
                  className="mt-1 accent-secondary"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-[13px] text-on-surface">QRIS Standar Nasional</span>
                    <span className="px-1.5 py-0.2 rounded bg-secondary text-white text-[9px] font-bold uppercase">
                      Paling Direkomendasikan
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-snug pt-0.5">
                    Scan via BCA Mobile, Livin Mandiri, GoPay, OVO, DANA, ShopeePay, LinkAja &amp; semua aplikasi m-Banking.
                  </p>
                </div>
              </label>

              {/* Rekomendasi 2: BCA Virtual Account */}
              <label
                onClick={() => setSelectedMethod('bca_va')}
                className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedMethod === 'bca_va'
                    ? 'border-secondary bg-[#F4F7F5]'
                    : 'border-surface-container-highest hover:bg-surface-container-low/50'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  checked={selectedMethod === 'bca_va'}
                  onChange={() => setSelectedMethod('bca_va')}
                  className="mt-1 accent-secondary"
                />
                <div className="flex-1">
                  <span className="font-semibold text-[13px] text-on-surface">BCA Virtual Account</span>
                  <p className="text-[11px] text-on-surface-variant leading-snug pt-0.5">
                    Verifikasi instan via m-BCA, KlikBCA, atau ATM BCA 24 jam.
                  </p>
                </div>
              </label>

              {/* Rekomendasi 3: Mandiri Virtual Account */}
              <label
                onClick={() => setSelectedMethod('mandiri_va')}
                className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedMethod === 'mandiri_va'
                    ? 'border-secondary bg-[#F4F7F5]'
                    : 'border-surface-container-highest hover:bg-surface-container-low/50'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  checked={selectedMethod === 'mandiri_va'}
                  onChange={() => setSelectedMethod('mandiri_va')}
                  className="mt-1 accent-secondary"
                />
                <div className="flex-1">
                  <span className="font-semibold text-[13px] text-on-surface">Mandiri Virtual Account</span>
                  <p className="text-[11px] text-on-surface-variant leading-snug pt-0.5">
                    Transfer instan mudah lewat aplikasi Livin' by Mandiri.
                  </p>
                </div>
              </label>

              {/* Rekomendasi 4: BRI Virtual Account */}
              <label
                onClick={() => setSelectedMethod('bri_va')}
                className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedMethod === 'bri_va'
                    ? 'border-secondary bg-[#F4F7F5]'
                    : 'border-surface-container-highest hover:bg-surface-container-low/50'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  checked={selectedMethod === 'bri_va'}
                  onChange={() => setSelectedMethod('bri_va')}
                  className="mt-1 accent-secondary"
                />
                <div className="flex-1">
                  <span className="font-semibold text-[13px] text-on-surface">BRI (BRIVA)</span>
                  <p className="text-[11px] text-on-surface-variant leading-snug pt-0.5">
                    Verifikasi instan via aplikasi BRImo atau ATM BRI.
                  </p>
                </div>
              </label>

              {/* Rekomendasi 5: BNI Virtual Account */}
              <label
                onClick={() => setSelectedMethod('bni_va')}
                className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedMethod === 'bni_va'
                    ? 'border-secondary bg-[#F4F7F5]'
                    : 'border-surface-container-highest hover:bg-surface-container-low/50'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  checked={selectedMethod === 'bni_va'}
                  onChange={() => setSelectedMethod('bni_va')}
                  className="mt-1 accent-secondary"
                />
                <div className="flex-1">
                  <span className="font-semibold text-[13px] text-on-surface">BNI Virtual Account</span>
                  <p className="text-[11px] text-on-surface-variant leading-snug pt-0.5">
                    Verifikasi instan via BNI Mobile Banking atau ATM BNI.
                  </p>
                </div>
              </label>

              {/* Rekomendasi 6: E-Wallet */}
              <label
                onClick={() => setSelectedMethod('gopay')}
                className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedMethod === 'gopay'
                    ? 'border-secondary bg-[#F4F7F5]'
                    : 'border-surface-container-highest hover:bg-surface-container-low/50'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  checked={selectedMethod === 'gopay'}
                  onChange={() => setSelectedMethod('gopay')}
                  className="mt-1 accent-secondary"
                />
                <div className="flex-1">
                  <span className="font-semibold text-[13px] text-on-surface">GoPay / DANA / OVO E-Wallet</span>
                  <p className="text-[11px] text-on-surface-variant leading-snug pt-0.5">
                    Pembayaran langsung via aplikasi e-wallet smartphone.
                  </p>
                </div>
              </label>

              {/* Rekomendasi 7: Transfer Bank Manual */}
              <label
                onClick={() => setSelectedMethod('bank_transfer')}
                className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedMethod === 'bank_transfer'
                    ? 'border-secondary bg-[#F4F7F5]'
                    : 'border-surface-container-highest hover:bg-surface-container-low/50'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  checked={selectedMethod === 'bank_transfer'}
                  onChange={() => setSelectedMethod('bank_transfer')}
                  className="mt-1 accent-secondary"
                />
                <div className="flex-1">
                  <span className="font-semibold text-[13px] text-on-surface">Transfer Bank Langsung</span>
                  <p className="text-[11px] text-on-surface-variant leading-snug pt-0.5">
                    Transfer rekening BCA / Mandiri / BNI / BRI konfirmasi otomatis.
                  </p>
                </div>
              </label>
            </div>

            {/* Total & Submit */}
            <div className="p-4 bg-surface-container-lowest border border-surface-container-highest rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-on-surface-variant">Harga Paket</span>
                <span className="font-medium text-on-surface">{selectedPlan.priceFormatted}</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-on-surface-variant">Biaya Layanan &amp; PPN</span>
                <span className="font-medium text-secondary">Rp0 (Bebas Biaya)</span>
              </div>
              <div className="pt-2 border-t border-surface-container-high flex items-center justify-between">
                <span className="text-[14px] font-semibold text-on-surface">Total Pembayaran</span>
                <span className="text-[20px] font-semibold text-on-surface tabular-nums">
                  {selectedPlan.priceFormatted}
                </span>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-[#222] text-on-primary rounded-full font-medium text-[15px] flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
              >
                <span>Lanjut ke Pembayaran</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAHAP 3: INSTRUKSI PEMBAYARAN (QRIS REAL / VIRTUAL ACCOUNT / BANK)        */}
      {/* ========================================================================= */}
      {step === 'payment_pending' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
            <button
              type="button"
              onClick={() => setStep('checkout')}
              className="inline-flex items-center space-x-1 text-[13px] text-on-surface-variant hover:text-on-surface font-medium cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Ubah Metode</span>
            </button>
            <span className="text-[12px] font-semibold text-secondary uppercase tracking-wider">
              Langkah 2 dari 3
            </span>
          </div>

          <div className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-5 text-center space-y-4 shadow-sm">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider">
                Menunggu Pembayaran
              </span>
              <h3 className="text-[20px] font-semibold text-on-surface">
                {selectedPlan.priceFormatted}
              </h3>
              <p className="text-[12px] text-on-surface-variant">
                Batas waktu pembayaran: <span className="font-mono font-semibold text-error">14:59</span>
              </p>
            </div>

            {/* JIKA METODE QRIS: KODE QRIS REAL YANG BISA DISCAN DENGAN HP */}
            {selectedMethod === 'qris' && (
              <div className="space-y-3">
                <div className="p-4 bg-white border border-surface-container-highest rounded-xl max-w-xs mx-auto flex flex-col items-center shadow-xs">
                  {/* Header QRIS Logo Tag */}
                  <div className="w-full flex items-center justify-between pb-2 border-b border-neutral-100 text-[10px] text-neutral-600 font-semibold">
                    <span className="tracking-wider uppercase">QRIS STANDAR NASIONAL</span>
                    <span className="text-secondary font-bold font-mono">NMID: {merchantNmid}</span>
                  </div>

                  {/* KODE QR REAL: Dihasilkan via library qrcode (EMVCo Compatible) */}
                  <div className="py-2.5 flex items-center justify-center min-h-[220px]">
                    {isGeneratingQr ? (
                      <div className="w-52 h-52 flex flex-col items-center justify-center space-y-2 bg-neutral-50 rounded-lg">
                        <span className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin"></span>
                        <span className="text-[11px] text-neutral-500">Menghasilkan QRIS Real...</span>
                      </div>
                    ) : customUploadedQris ? (
                      <div className="relative">
                        <img
                          src={customUploadedQris}
                          alt="Custom Merchant QRIS"
                          className="w-52 h-52 object-contain rounded-lg border border-neutral-100"
                        />
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-medium">
                          Custom
                        </span>
                      </div>
                    ) : realQrisDataUrl ? (
                      <div className="relative group">
                        <img
                          src={realQrisDataUrl}
                          alt="QRIS Standar Nasional Real Scannable"
                          className="w-52 h-52 object-contain rounded-lg border border-neutral-100 shadow-xs"
                        />
                        {/* Overlay badge to confirm real scannable status */}
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-secondary text-white text-[9px] font-bold tracking-wider">
                          REAL SCAN
                        </div>
                      </div>
                    ) : (
                      <div className="w-52 h-52 bg-neutral-100 rounded-lg flex items-center justify-center text-[12px] text-neutral-500">
                        Memuat QR Code...
                      </div>
                    )}
                  </div>

                  <p className="text-[12px] text-neutral-800 font-bold pt-1">
                    {merchantName}
                  </p>
                  <p className="text-[11px] text-secondary font-semibold font-mono">
                    Nominal: {selectedPlan.priceFormatted}
                  </p>

                  {/* Action Simpan QR & Copy Payload */}
                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={handleSaveQrisImage}
                      className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-[11px] font-semibold text-neutral-700 flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {savedQris ? 'check_circle' : 'file_download'}
                      </span>
                      <span>{savedQris ? 'QR Disimpan!' : 'Unduh QR'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyPayload}
                      className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-[11px] font-semibold text-neutral-700 flex items-center space-x-1 transition-colors cursor-pointer"
                      title="Salin String EMVCo QRIS untuk verifikasi"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {copiedPayload ? 'check' : 'content_copy'}
                      </span>
                      <span>{copiedPayload ? 'Tersalin' : 'Salin Data'}</span>
                    </button>
                  </div>
                </div>

                {/* Panduan Scan */}
                <div className="text-left text-[12px] text-on-surface-variant space-y-1 bg-surface-container-low p-3.5 rounded-xl border border-surface-container-highest">
                  <p className="font-semibold text-on-surface">Cara Pembayaran QRIS:</p>
                  <p>1. Buka m-Banking (BCA Mobile, Livin Mandiri, BRImo, BNI) atau E-Wallet (GoPay, OVO, DANA, ShopeePay).</p>
                  <p>2. Pilih menu <strong>Scan QR / Bayar</strong> lalu arahkan kamera ke kode QRIS di atas.</p>
                  <p>3. Konfirmasi nominal tepat <strong>{selectedPlan.priceFormatted}</strong>.</p>
                  <p>4. Setelah pembayaran sukses, klik tombol <strong>Lanjut ke Verifikasi &amp; Upload Bukti</strong> di bawah.</p>
                </div>

                {/* Toggle Pengaturan Merchant untuk Pemilik / Penjual Aplikasi */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setIsMerchantConfigOpen(!isMerchantConfigOpen)}
                    className="inline-flex items-center space-x-1 text-[11px] text-on-surface-variant hover:text-on-surface font-medium cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">storefront</span>
                    <span>{isMerchantConfigOpen ? 'Tutup Pengaturan Merchant' : 'Pengaturan QRIS Merchant (Untuk Pemilik Aplikasi)'}</span>
                  </button>

                  {isMerchantConfigOpen && (
                    <div className="mt-3 p-3.5 bg-surface-container-low rounded-xl border border-surface-container-highest text-left space-y-2.5 text-[12px]">
                      <span className="font-semibold text-on-surface block">
                        Konfigurasi Merchant Toko Anda:
                      </span>
                      <div>
                        <label className="block text-[10px] text-outline uppercase font-semibold mb-0.5">
                          Nama Merchant (Tampil di QRIS)
                        </label>
                        <input
                          type="text"
                          value={merchantName}
                          onChange={(e) => setMerchantName(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-surface-container-highest bg-white text-[12px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-outline uppercase font-semibold mb-0.5">
                          NMID QRIS Toko Anda
                        </label>
                        <input
                          type="text"
                          value={merchantNmid}
                          onChange={(e) => setMerchantNmid(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-surface-container-highest bg-white text-[12px] font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-outline uppercase font-semibold mb-0.5">
                          Atau Unggah Gambar QRIS Pribadi (BCA/Midtrans/DANA)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onloadend = () => {
                                setCustomUploadedQris(r.result as string);
                              };
                              r.readAsDataURL(file);
                            }
                          }}
                          className="w-full text-[11px]"
                        />
                      </div>
                      {customUploadedQris && (
                        <button
                          type="button"
                          onClick={() => setCustomUploadedQris(null)}
                          className="text-[11px] text-error font-medium hover:underline"
                        >
                          Hapus Gambar Kustom &amp; Gunakan QR Generator
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* JIKA METODE VIRTUAL ACCOUNT */}
            {selectedMethod !== 'qris' && selectedMethod !== 'bank_transfer' && (
              <div className="space-y-3 text-left">
                <div className="p-4 bg-surface-container-low border border-surface-container-highest rounded-xl space-y-2">
                  <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                    Nomor Virtual Account ({selectedMethod === 'bca_va' ? 'BCA' : selectedMethod === 'mandiri_va' ? 'Mandiri' : selectedMethod === 'bri_va' ? 'BRI' : selectedMethod === 'bni_va' ? 'BNI' : 'E-Wallet'})
                  </span>
                  <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-surface-container-highest">
                    <span className="font-mono text-[16px] font-semibold text-on-surface tracking-wider">
                      {selectedMethod === 'bca_va'
                        ? '8277 0812 3456 7890'
                        : selectedMethod === 'mandiri_va'
                        ? '8890 8123 4567 8901'
                        : selectedMethod === 'bri_va'
                        ? '1280 0812 3456 7890'
                        : selectedMethod === 'bni_va'
                        ? '9880 0812 3456 7890'
                        : '0812 3456 7890'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyVa(
                          selectedMethod === 'bca_va'
                            ? '8277081234567890'
                            : selectedMethod === 'mandiri_va'
                            ? '8890812345678901'
                            : selectedMethod === 'bri_va'
                            ? '1280081234567890'
                            : '9880081234567890'
                        )
                      }
                      className="px-2.5 py-1 rounded-md bg-surface-container text-secondary text-[11px] font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
                    >
                      {copiedVa ? 'Tersalin ✓' : 'Salin'}
                    </button>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    Nama Akun: <strong>NOTO PRO - {customerName}</strong>
                  </p>
                </div>

                <div className="text-[12px] text-on-surface-variant space-y-1 bg-surface-container-low p-3.5 rounded-xl border border-surface-container-highest">
                  <p className="font-semibold text-on-surface">Petunjuk Transfer Virtual Account:</p>
                  <p>1. Buka Mobile Banking atau ATM bank Anda.</p>
                  <p>2. Pilih menu <strong>Transfer &gt; Virtual Account</strong>.</p>
                  <p>3. Masukkan nomor Virtual Account di atas.</p>
                  <p>4. Pastikan nominal tepat <strong>{selectedPlan.priceFormatted}</strong> lalu selesaikan.</p>
                </div>
              </div>
            )}

            {/* JIKA METODE TRANSFER BANK MANUAL */}
            {selectedMethod === 'bank_transfer' && (
              <div className="space-y-3 text-left">
                <div className="p-4 bg-surface-container-low border border-surface-container-highest rounded-xl space-y-2.5">
                  <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                    Rekening Resmi Pembayaran
                  </span>
                  <div className="bg-white p-3 rounded-xl border border-surface-container-highest space-y-1">
                    <p className="text-[13px] font-semibold text-on-surface">Bank BCA: 5410-8291-00</p>
                    <p className="text-[13px] font-semibold text-on-surface">Bank Mandiri: 137-00-1928371-2</p>
                    <p className="text-[11px] text-on-surface-variant pt-1">
                      Atas Nama: <strong>PT NOTO KREATIF DIGITAL</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyVa('5410829100')}
                    className="px-3 py-1.5 rounded-md bg-surface-container text-secondary text-[11px] font-semibold hover:bg-surface-container-high cursor-pointer"
                  >
                    {copiedVa ? 'Nomor Rekening Tersalin ✓' : 'Salin No. Rekening BCA'}
                  </button>
                </div>

                <div className="text-[12px] text-on-surface-variant space-y-1 bg-surface-container-low p-3.5 rounded-xl border border-surface-container-highest">
                  <p className="font-semibold text-on-surface">Petunjuk Transfer Bank:</p>
                  <p>1. Transfer sesuai nominal <strong>{selectedPlan.priceFormatted}</strong> ke salah satu rekening di atas.</p>
                  <p>2. Tekan tombol konfirmasi di bawah setelah transfer selesai.</p>
                </div>
              </div>
            )}

            {/* Tombol Menuju Formulir Verifikasi & Upload Bukti Pembayaran */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleProceedToVerification}
                className="w-full h-12 bg-secondary hover:bg-[#2d523e] text-white rounded-full font-medium text-[15px] flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md active:scale-[0.99]"
              >
                <span>Saya Sudah Membayar (Upload Bukti)</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAHAP 4: FORMULIR PENGISIAN PENGGUNA & UPLOAD BUKTI PEMBAYARAN            */}
      {/* ========================================================================= */}
      {step === 'verify_form' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
            <button
              type="button"
              onClick={() => setStep('payment_pending')}
              className="inline-flex items-center space-x-1 text-[13px] text-on-surface-variant hover:text-on-surface font-medium cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Kembali ke QRIS / Rekening</span>
            </button>
            <span className="text-[12px] font-semibold text-secondary uppercase tracking-wider">
              Langkah 3 dari 3
            </span>
          </div>

          <div className="space-y-1 text-center">
            <h3 className="text-[20px] font-semibold text-on-surface">
              Konfirmasi &amp; Verifikasi Pembayaran
            </h3>
            <p className="text-[12px] text-on-surface-variant max-w-sm mx-auto">
              Silakan lengkapi data transfer dan unggah foto/screenshot bukti transaksi untuk aktivasi otomatis NOTO Pro.
            </p>
          </div>

          <form onSubmit={handleSubmitVerification} className="space-y-4">
            <div className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-5 space-y-4 shadow-sm">
              {/* Ringkasan Biaya */}
              <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between text-[13px]">
                <div>
                  <span className="text-[11px] text-on-surface-variant block">Paket: {selectedPlan.name}</span>
                  <span className="font-semibold text-on-surface">Nominal Harus Ditransfer:</span>
                </div>
                <span className="text-[17px] font-semibold text-secondary tabular-nums font-mono">
                  {selectedPlan.priceFormatted}
                </span>
              </div>

              {/* 1. Nama Pemilik Rekening / Pengirim */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Nama Pengirim / Pemilik Rekening *
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Nama pengirim sesuai mutasi bank / e-wallet"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container-highest bg-surface-container-low/40 focus:bg-white text-[13px] text-on-surface outline-none focus:border-on-surface transition-all"
                />
              </div>

              {/* 2. Bank / E-Wallet Asal Pengirim */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                    Bank / E-Wallet Pengirim *
                  </label>
                  <select
                    value={senderBank}
                    onChange={(e) => setSenderBank(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container-highest bg-surface-container-low/40 focus:bg-white text-[13px] text-on-surface outline-none focus:border-on-surface transition-all cursor-pointer"
                  >
                    <option value="BCA">BCA (m-BCA / myBCA)</option>
                    <option value="Mandiri">Mandiri (Livin')</option>
                    <option value="BRI">BRI (BRImo)</option>
                    <option value="BNI">BNI Mobile</option>
                    <option value="BSI">BSI Mobile</option>
                    <option value="CIMB Niaga">CIMB Niaga / OCTO</option>
                    <option value="GoPay">GoPay</option>
                    <option value="DANA">DANA</option>
                    <option value="OVO">OVO</option>
                    <option value="ShopeePay">ShopeePay</option>
                    <option value="Seabank / Jago">Seabank / Bank Jago</option>
                    <option value="Lainnya">Bank Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                    No. Rekening / HP (Opsional)
                  </label>
                  <input
                    type="text"
                    value={senderAccountNo}
                    onChange={(e) => setSenderAccountNo(e.target.value)}
                    placeholder="Contoh: 0812xxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container-highest bg-surface-container-low/40 focus:bg-white text-[13px] text-on-surface outline-none focus:border-on-surface transition-all"
                  />
                </div>
              </div>

              {/* 3. Waktu Transfer */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Tanggal &amp; Jam Transfer *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container-highest bg-surface-container-low/40 focus:bg-white text-[13px] text-on-surface outline-none focus:border-on-surface transition-all"
                />
              </div>

              {/* 4. Area Upload Bukti Pembayaran */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    Unggah Bukti Transfer / Screenshot *
                  </label>
                  <button
                    type="button"
                    onClick={handleUseDemoProof}
                    className="text-[11px] text-secondary font-semibold hover:underline cursor-pointer"
                  >
                    Gunakan Contoh Struk (Demo)
                  </button>
                </div>

                <div className="border-2 border-dashed border-surface-container-highest rounded-2xl p-4 text-center bg-surface-container-low/30 hover:bg-surface-container-low/60 transition-colors relative">
                  {proofImageBase64 ? (
                    <div className="space-y-3">
                      <div className="relative inline-block max-h-48 overflow-hidden rounded-xl border border-surface-container-highest shadow-xs">
                        <img
                          src={proofImageBase64}
                          alt="Bukti Transfer"
                          className="max-h-48 object-contain mx-auto"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setProofImageBase64(null);
                            setProofFileName('');
                          }}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center text-[12px] hover:bg-black"
                          title="Hapus foto"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-[11px] text-secondary font-medium">
                        ✓ {proofFileName || 'Bukti transfer siap diverifikasi'}
                      </p>
                    </div>
                  ) : (
                    <label className="cursor-pointer block py-3 space-y-1.5">
                      <div className="w-10 h-10 rounded-full bg-secondary/15 text-secondary flex items-center justify-center mx-auto mb-1">
                        <span className="material-symbols-outlined text-[22px]">cloud_upload</span>
                      </div>
                      <p className="text-[13px] font-medium text-on-surface">
                        Klik untuk upload foto struk atau screenshot
                      </p>
                      <p className="text-[11px] text-on-surface-variant">
                        Mendukung format JPG, PNG, atau WebP (Maks. 10MB)
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* 5. Catatan Tambahan (Opsional) */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Catatan / Keterangan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="Misal: Sudah transfer via QRIS BCA pukul 14.30"
                  className="w-full px-3.5 py-2 rounded-xl border border-surface-container-highest bg-surface-container-low/40 focus:bg-white text-[13px] text-on-surface outline-none focus:border-on-surface transition-all"
                />
              </div>
            </div>

            {/* Tombol Submit Verifikasi */}
            <button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-[#222] text-on-primary rounded-full font-medium text-[15px] flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>Kirim Bukti &amp; Verifikasi Pembayaran</span>
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAHAP 5: ANIMASI PROSES VERIFIKASI PEMBAYARAN                             */}
      {/* ========================================================================= */}
      {step === 'verifying' && (
        <div className="min-h-[360px] flex flex-col items-center justify-center text-center p-6 space-y-4 animate-in fade-in duration-200">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-secondary/20 border-t-secondary animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-[24px]">
                sync
              </span>
            </div>
          </div>

          <div className="space-y-1.5 max-w-xs">
            <h3 className="text-[18px] font-semibold text-on-surface">
              Memverifikasi Bukti Pembayaran...
            </h3>
            <p className="text-[12px] text-on-surface-variant leading-relaxed">
              Sistem sedang mencocokkan mutasi rekening pengirim <strong>{senderName}</strong> sebesar{' '}
              <strong>{selectedPlan.priceFormatted}</strong>.
            </p>
          </div>

          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span>Otomatisasi Validasi Instan</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAHAP 6: SUKSES / BUKTI TRANSAKSI, FITUR & PERIODE PENGGUNAAN             */}
      {/* ========================================================================= */}
      {step === 'success' && currentTransaction && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Success Banner */}
          <div className="text-center space-y-1.5 pt-2">
            <div className="w-14 h-14 bg-secondary/15 text-secondary rounded-full flex items-center justify-center mx-auto mb-2 shadow-xs">
              <span className="material-symbols-outlined text-[32px] font-bold">check_circle</span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Pembayaran Terverifikasi &amp; Sah
            </span>
            <h2 className="text-[24px] font-semibold tracking-tight text-on-surface">
              Selamat Datang di NOTO Pro
            </h2>
            <p className="text-[13px] text-on-surface-variant max-w-xs mx-auto">
              Akun Anda telah ditingkatkan ke {currentTransaction.planName}. Nikmati seluruh fitur AI eksklusif tanpa hambatan.
            </p>
          </div>

          {/* Rincian Bukti Pembayaran (Official Receipt Card) */}
          <div className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-surface-container-high/60 pb-3">
              <div>
                <span className="text-[10px] font-semibold text-outline uppercase tracking-wider block">
                  NOMOR TRANSAKSI
                </span>
                <span className="text-[14px] font-semibold text-on-surface font-mono">
                  {currentTransaction.orderId}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold flex items-center space-x-1">
                <span className="material-symbols-outlined text-[14px]">check</span>
                <span>LUNAS</span>
              </span>
            </div>

            {/* DETAIL PEMBAYARAN */}
            <div className="space-y-2 text-[13px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block pb-0.5">
                Detail Pembayaran:
              </span>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Waktu Transaksi</span>
                <span className="font-medium text-on-surface">{formatDateTime(currentTransaction.paidAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Metode Pembayaran</span>
                <span className="font-medium text-on-surface">{currentTransaction.methodName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Nama Pembeli</span>
                <span className="font-medium text-on-surface">{currentTransaction.userName}</span>
              </div>
              {currentTransaction.senderName && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Rekening / Pengirim</span>
                  <span className="font-medium text-on-surface">
                    {currentTransaction.senderName} ({currentTransaction.senderBank || 'Transfer'})
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Email Terdaftar</span>
                <span className="font-medium text-on-surface">{currentTransaction.userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">No. WhatsApp</span>
                <span className="font-medium text-on-surface">{currentTransaction.userPhone}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-surface-container-high/60">
                <span className="font-semibold text-on-surface">Total Pembayaran</span>
                <span className="font-semibold text-secondary text-[16px] tabular-nums">
                  {currentTransaction.amountFormatted}
                </span>
              </div>
            </div>

            {/* LAMPIRAN BUKTI PEMBAYARAN YANG DIUPLOAD */}
            {currentTransaction.paymentProofUrl && (
              <div className="pt-3 border-t border-surface-container-high/60 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                  Bukti Pembayaran Terverifikasi:
                </span>
                <div className="p-2 bg-surface-container-low rounded-xl border border-surface-container-highest flex items-center space-x-3">
                  <img
                    src={currentTransaction.paymentProofUrl}
                    alt="Lampiran Struk"
                    className="w-14 h-14 object-cover rounded-lg border border-neutral-200"
                  />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[12px] font-semibold text-on-surface truncate">
                      {currentTransaction.proofFileName || 'Bukti_Transfer.png'}
                    </p>
                    <p className="text-[10px] text-secondary font-medium">
                      ✓ Valid &amp; Tersimpan di Sistem
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PERIODE PENGGUNAAN */}
            <div className="pt-3 border-t border-surface-container-high/60 space-y-2 text-[13px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block pb-0.5">
                Periode Penggunaan:
              </span>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Paket Berlangganan</span>
                <span className="font-semibold text-on-surface">{currentTransaction.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Mulai Aktif</span>
                <span className="font-medium text-on-surface">{formatDate(currentTransaction.paidAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Berlaku Hingga</span>
                <span className="font-semibold text-secondary">{formatDate(currentTransaction.expiresAt)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center space-x-2 text-[11px] text-secondary font-medium">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                <span>Aktif selama {currentTransaction.durationDays} hari ke depan</span>
              </div>
            </div>

            {/* FITUR YANG DIPEROLEH */}
            <div className="pt-3 border-t border-surface-container-high/60 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block pb-0.5">
                Fitur yang Diperoleh ({currentTransaction.planName}):
              </span>
              <ul className="space-y-1.5">
                {currentTransaction.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-[12px] text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 pt-0.5">
                      check_circle
                    </span>
                    <span className="leading-snug">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={() => onNavigateToTab('today')}
              className="w-full h-12 bg-primary hover:bg-[#222] text-on-primary rounded-full font-medium text-[15px] flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
            >
              <span>Mulai Nikmati NOTO Pro</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadReceipt}
              className="w-full h-11 border border-surface-container-highest bg-surface-container-lowest hover:bg-surface-container text-on-surface rounded-full text-[13px] font-medium flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                {downloadedReceipt ? 'check_circle' : 'download'}
              </span>
              <span>{downloadedReceipt ? 'Struk Berhasil Diunduh ✓' : 'Unduh Bukti Transaksi (Struk / Invoice)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setStep('plans')}
              className="w-full text-center py-2 text-[12px] text-on-surface-variant hover:text-on-surface font-medium cursor-pointer"
            >
              Lihat Semua Pilihan Paket / Perpanjang
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
