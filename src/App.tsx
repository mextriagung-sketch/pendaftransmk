import { useState, useRef, FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "motion/react";
import { GraduationCap, Send, CheckCircle2, AlertCircle, Loader2, Download, Printer, Key, Search, ArrowLeft } from "lucide-react";
import { toJpeg } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  nisn: z.string().min(10, "NISN harus 10 digit").max(10, "NISN harus 10 digit"),
  birthPlace: z.string().min(2, "Tempat lahir minimal 2 karakter"),
  birthDate: z.string().min(1, "Tanggal lahir harus diisi"),
  phone: z.string().min(10, "Nomor HP minimal 10 digit"),
  address: z.string().min(5, "Alamat minimal 5 karakter"),
  school: z.string().min(3, "Asal sekolah minimal 3 karakter"),
  major: z.string().min(1, "Silakan pilih jurusan"),
  fatherName: z.string().min(3, "Nama ayah minimal 3 karakter"),
  motherName: z.string().min(3, "Nama ibu minimal 3 karakter"),
  hasIjazah: z.boolean(),
  hasCopyNisn: z.boolean(),
  hasRapor: z.boolean(),
  hasKK: z.boolean(),
  hasAkte: z.boolean(),
  hasKtpOrangTua: z.boolean(),
  hasKip: z.boolean(),
  hasSertifikat: z.boolean(),
  hasFoto: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function App() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenVerified, setIsTokenVerified] = useState(false);
  const [isReprintMode, setIsReprintMode] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [reprintNisn, setReprintNisn] = useState("");
  const [reprintMajor, setReprintMajor] = useState("");
  const [submittedData, setSubmittedData] = useState<FormValues | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const scriptUrl = "https://script.google.com/macros/s/AKfycbwnf95D8SpPoH_nnGrXac_XL3HMRtzm_22DIGALYrJuUqcAo2Sue9RnALgp0KJGlUMT/exec";

  const handleTokenSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (tokenInput === "smk2026") {
      setIsTokenVerified(true);
      toast.success("Token Berhasil", {
        description: "Selamat datang di formulir pendaftaran.",
      });
    } else {
      toast.error("Token Salah", {
        description: "Silakan masukkan token yang benar.",
      });
    }
  };

  const handleReprintSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!reprintNisn || !reprintMajor) {
      toast.error("Data Tidak Lengkap", {
        description: "Silakan masukkan NISN dan pilih Jurusan.",
      });
      return;
    }

    setIsSearching(true);
    try {
      const url = `${scriptUrl}?nisn=${reprintNisn}&major=${encodeURIComponent(reprintMajor)}`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        // Ensure major is included in the data
        const dataWithMajor = { ...result.data, major: reprintMajor };
        setSubmittedData(dataWithMajor);
        setIsSuccess(true);
        setIsTokenVerified(true); // Allow seeing the card
        toast.success("Data Ditemukan", {
          description: "Silakan cetak ulang kartu Anda.",
        });
      } else {
        toast.error("Tidak Ditemukan", {
          description: result.error || "Data tidak ditemukan. Periksa NISN dan Jurusan.",
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Kesalahan Sistem", {
        description: "Gagal menghubungi server. Pastikan link Apps Script benar.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      major: "",
      hasIjazah: false,
      hasCopyNisn: false,
      hasRapor: false,
      hasKK: false,
      hasAkte: false,
      hasKtpOrangTua: false,
      hasKip: false,
      hasSertifikat: false,
      hasFoto: false,
    },
  });

  const selectedMajor = watch("major");

  const getMapInfo = (major: string) => {
    switch (major) {
      case "Teknik Otomotif Sepeda Motor":
        return { color: "Biru", code: "TSM / Otomotif" };
      case "Akuntansi":
        return { color: "Merah", code: "AKL / Akuntansi" };
      case "Pertanian":
        return { color: "Hijau", code: "ATPH / Pertanian" };
      default:
        return null;
    }
  };

  const mapInfo = getMapInfo(selectedMajor);

  const downloadJpg = async () => {
    if (cardRef.current === null) return;
    
    setIsDownloading(true);
    try {
      const dataUrl = await toJpeg(cardRef.current, { 
        quality: 0.95,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });
      
      const link = document.createElement("a");
      link.download = `Kartu_PPDB_${submittedData?.name?.replace(/\s+/g, "_") || "Siswa"}.jpg`;
      link.href = dataUrl;
      link.click();
      
      toast.success("Berhasil!", {
        description: "Kartu pendaftaran telah diunduh dalam format JPG.",
      });
    } catch (err) {
      console.error("Oops, something went wrong!", err);
      toast.error("Gagal Mengunduh", {
        description: "Terjadi kesalahan saat membuat gambar JPG.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    // Masukkan link Google Apps Script Anda di sini

    try {
      // Using 'no-cors' mode might be necessary if Apps Script doesn't handle CORS correctly,
      // but then we can't read the response. 
      // A better way is to use a standard POST and ensure the Apps Script returns the right headers.
      // However, Apps Script Web Apps are tricky with CORS. 
      // We'll try a standard fetch first.
      const response = await fetch(scriptUrl, {
        method: "POST",
        mode: "cors", // Try cors first
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // Apps Script likes text/plain for POST data sometimes to avoid preflight
        body: JSON.stringify(data),
      });

      // Apps Script redirects can cause issues with fetch in some environments,
      // but usually it works.
      const result = await response.json();

      if (result.success) {
        toast.success("Pendaftaran Berhasil!", {
          description: "Data Anda telah tersimpan di Google Sheets.",
        });
        setSubmittedData(data);
        setIsSuccess(true);
        reset();
      } else {
        throw new Error(result.error || "Gagal mendaftar");
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error("Pendaftaran Gagal", {
        description: "Terjadi kesalahan saat mengirim data. Pastikan URL Apps Script benar dan sudah di-deploy sebagai 'Anyone'.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">SMK N 1 LALAN</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Penerimaan Siswa Baru</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {!isTokenVerified ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto"
          >
            {isReprintMode ? (
              <Card className="shadow-2xl border-blue-100">
                <CardHeader className="text-center space-y-2 bg-blue-50/50 rounded-t-xl border-b border-blue-100">
                  <div className="mx-auto bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                    <Search className="text-blue-600 w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl font-bold text-blue-900">Cetak Ulang Kartu</CardTitle>
                  <CardDescription>
                    Masukkan NISN dan Jurusan saat mendaftar.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleReprintSearch} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reprintNisn" className="text-sm font-semibold">NISN Siswa</Label>
                      <Input 
                        id="reprintNisn" 
                        placeholder="Masukkan 10 digit NISN" 
                        value={reprintNisn}
                        onChange={(e) => setReprintNisn(e.target.value)}
                        maxLength={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reprintMajor" className="text-sm font-semibold">Jurusan</Label>
                      <Select value={reprintMajor} onValueChange={setReprintMajor}>
                        <SelectTrigger id="reprintMajor">
                          <SelectValue placeholder="Pilih Jurusan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Teknik Otomotif Sepeda Motor">Teknik Otomotif Sepeda Motor</SelectItem>
                          <SelectItem value="Akuntansi">Akuntansi</SelectItem>
                          <SelectItem value="Pertanian">Pertanian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isSearching}
                      className="w-full bg-blue-600 hover:bg-blue-700 font-bold py-6 rounded-xl flex items-center justify-center gap-2"
                    >
                      {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                      Cari Data Pendaftaran
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost"
                      onClick={() => setIsReprintMode(false)}
                      className="w-full text-slate-500 flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Kembali
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-2xl border-blue-100">
                <CardHeader className="text-center space-y-2 bg-blue-50/50 rounded-t-xl border-b border-blue-100">
                  <div className="mx-auto bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                    <Key className="text-blue-600 w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl font-bold text-blue-900">Akses Terbatas</CardTitle>
                  <CardDescription>
                    Silakan masukkan token pendaftaran untuk melanjutkan.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleTokenSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="token" className="text-sm font-semibold">Token Pendaftaran</Label>
                      <Input 
                        id="token" 
                        type="password"
                        placeholder="Masukkan token di sini" 
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        className="text-center text-lg tracking-widest font-mono"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold py-6 rounded-xl">
                      Masuk ke Formulir
                    </Button>
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200"></span>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-slate-400">Atau</span>
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setIsReprintMode(true)}
                      className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 font-semibold py-6 rounded-xl flex items-center justify-center gap-2"
                    >
                      <Printer className="w-5 h-5" /> Cetak Ulang Kartu
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="text-center justify-center text-xs text-slate-400">
                  Hubungi panitia jika Anda belum memiliki token.
                </CardFooter>
              </Card>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
          {isSuccess && submittedData ? (
            <div className="space-y-6">
              <div ref={cardRef}>
                <Card className="border-2 border-green-100 bg-white shadow-2xl overflow-hidden print:shadow-none print:border-none">
                  <div className="bg-blue-600 p-6 text-white text-center space-y-2 print:bg-blue-600 print:text-white">
                    <GraduationCap className="w-12 h-12 mx-auto mb-2" />
                    <h2 className="text-2xl font-bold">KARTU BUKTI PENDAFTARAN</h2>
                    <p className="text-blue-100 text-sm">PENERIMAAN PESERTA DIDIK BARU (PPDB)</p>
                    <p className="font-bold text-lg">SMK NEGERI 1 LALAN</p>
                  </div>
                  
                  <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h3 className="font-bold text-blue-600 border-b pb-1 text-sm uppercase">Data Calon Siswa</h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Nama Lengkap</p>
                            <p className="font-semibold text-slate-800">{submittedData.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">NISN</p>
                            <p className="font-semibold text-slate-800">{submittedData.nisn}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Tempat, Tgl Lahir</p>
                            <p className="font-semibold text-slate-800">{submittedData.birthPlace}, {submittedData.birthDate}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Asal Sekolah</p>
                            <p className="font-semibold text-slate-800">{submittedData.school}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-bold text-blue-600 border-b pb-1 text-sm uppercase">Pilihan Jurusan</h3>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Jurusan Yang Dipilih</p>
                          <p className="text-lg font-bold text-blue-700">{submittedData.major}</p>
                          {mapInfo && (
                            <p className="mt-2 text-sm font-medium flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${
                                mapInfo.color === "Biru" ? "bg-blue-500" :
                                mapInfo.color === "Merah" ? "bg-red-500" :
                                "bg-green-500"
                              }`}></span>
                              Map Warna: <span className="font-bold">{mapInfo.color}</span>
                            </p>
                          )}
                        </div>
                        
                        <div className="pt-2">
                          <p className="text-xs text-slate-500 uppercase font-bold">Nomor HP / WA</p>
                          <p className="font-semibold text-slate-800">{submittedData.phone}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                      <div className="space-y-4">
                        <h3 className="font-bold text-blue-600 border-b pb-1 text-sm uppercase">Data Orang Tua</h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Nama Ayah</p>
                            <p className="font-semibold text-slate-800">{submittedData.fatherName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Nama Ibu</p>
                            <p className="font-semibold text-slate-800">{submittedData.motherName}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col justify-end items-center space-y-2 border-2 border-dashed border-slate-200 p-4 rounded-lg">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Pas Foto 3x4</p>
                        <div className="w-24 h-32 bg-slate-50 border border-slate-100 flex items-center justify-center">
                          <span className="text-slate-300 text-[10px]">Tempel Foto</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 print:bg-white print:border-slate-200">
                      <p className="text-xs font-bold text-blue-800 mb-2 uppercase">Catatan Penting:</p>
                      <ul className="text-[11px] text-blue-700 space-y-1 list-disc pl-4 print:text-slate-700">
                        <li>Bawa kartu ini saat melakukan verifikasi berkas di sekolah.</li>
                        <li>Pastikan semua berkas persyaratan sudah lengkap di dalam map sesuai warna jurusan.</li>
                        <li>Simpan bukti pendaftaran ini dengan baik.</li>
                      </ul>
                    </div>

                    <div className="flex justify-between items-end pt-8">
                      <div className="text-[10px] text-slate-400 italic">
                        Dicetak pada: {new Date().toLocaleString("id-ID")}
                      </div>
                      <div className="text-center space-y-12">
                        <p className="text-xs font-bold text-slate-800">Panitia PPDB SMK N 1 Lalan</p>
                        <div className="w-32 border-b border-slate-400 mx-auto"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 print:hidden">
                <Button 
                  onClick={downloadJpg}
                  disabled={isDownloading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-6 rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  {isDownloading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  Simpan Kartu (JPG)
                </Button>
                <Button 
                  onClick={() => window.print()}
                  variant="outline"
                  className="flex-1 border-blue-200 hover:bg-blue-50 text-blue-600 font-bold py-6 rounded-xl flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  Cetak Kartu
                </Button>
                <Button 
                  onClick={() => {
                    setIsSuccess(false);
                    setSubmittedData(null);
                  }}
                  variant="ghost"
                  className="flex-1 text-slate-500 font-bold py-6 rounded-xl"
                >
                  Daftar Lagi
                </Button>
              </div>
            </div>
          ) : (
            <Card className="shadow-xl border-slate-200">
              <CardHeader className="space-y-1 bg-slate-50/50 border-b border-slate-100 rounded-t-xl">
                <CardTitle className="text-2xl font-bold tracking-tight">Formulir Pendaftaran</CardTitle>
                <CardDescription className="text-slate-500">
                  Silakan lengkapi data diri Anda untuk mendaftar sebagai calon siswa baru.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  {/* Data Diri */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 border-b pb-2">Data Pribadi Siswa</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-semibold">Nama Lengkap <span className="text-red-500">*</span></Label>
                        <Input 
                          id="name" 
                          placeholder="Masukkan nama lengkap" 
                          {...register("name")}
                          className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.name && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.name.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nisn" className="text-sm font-semibold">NISN <span className="text-red-500">*</span></Label>
                        <Input 
                          id="nisn" 
                          placeholder="10 digit NISN" 
                          {...register("nisn")}
                          className={errors.nisn ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.nisn && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.nisn.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="birthPlace" className="text-sm font-semibold">Tempat Lahir <span className="text-red-500">*</span></Label>
                        <Input 
                          id="birthPlace" 
                          placeholder="Kota tempat lahir" 
                          {...register("birthPlace")}
                          className={errors.birthPlace ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.birthPlace && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.birthPlace.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="birthDate" className="text-sm font-semibold">Tanggal Lahir <span className="text-red-500">*</span></Label>
                        <Input 
                          id="birthDate" 
                          type="date"
                          {...register("birthDate")}
                          className={errors.birthDate ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.birthDate && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.birthDate.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-semibold">Nomor HP / WhatsApp <span className="text-red-500">*</span></Label>
                        <Input 
                          id="phone" 
                          placeholder="0812xxxxxxxx" 
                          {...register("phone")}
                          className={errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.phone && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.phone.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="school" className="text-sm font-semibold">Asal Sekolah (SMP/MTs) <span className="text-red-500">*</span></Label>
                        <Input 
                          id="school" 
                          placeholder="Nama sekolah asal" 
                          {...register("school")}
                          className={errors.school ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.school && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.school.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="major" className="text-sm font-semibold">Pilihan Jurusan <span className="text-red-500">*</span></Label>
                        <Select onValueChange={(value: string) => setValue("major", value)}>
                          <SelectTrigger className={errors.major ? "border-red-500 focus-visible:ring-red-500" : ""}>
                            <SelectValue placeholder="Pilih jurusan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Teknik Otomotif Sepeda Motor">Teknik Otomotif Sepeda Motor</SelectItem>
                            <SelectItem value="Akuntansi">Akuntansi</SelectItem>
                            <SelectItem value="Pertanian">Pertanian</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.major && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.major.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-semibold">Alamat Lengkap <span className="text-red-500">*</span></Label>
                      <Input 
                        id="address" 
                        placeholder="Masukkan alamat tempat tinggal saat ini" 
                        {...register("address")}
                        className={errors.address ? "border-red-500 focus-visible:ring-red-500" : ""}
                      />
                      {errors.address && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.address.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Data Orang Tua */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 border-b pb-2">Data Orang Tua</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="fatherName" className="text-sm font-semibold">Nama Ayah <span className="text-red-500">*</span></Label>
                        <Input 
                          id="fatherName" 
                          placeholder="Nama lengkap ayah" 
                          {...register("fatherName")}
                          className={errors.fatherName ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.fatherName && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.fatherName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="motherName" className="text-sm font-semibold">Nama Ibu <span className="text-red-500">*</span></Label>
                        <Input 
                          id="motherName" 
                          placeholder="Nama lengkap ibu" 
                          {...register("motherName")}
                          className={errors.motherName ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.motherName && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.motherName.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Persyaratan Berkas */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600">Persyaratan Berkas</h3>
                      {mapInfo && (
                        <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${
                          mapInfo.color === "Biru" ? "bg-blue-100 text-blue-700" :
                          mapInfo.color === "Merah" ? "bg-red-100 text-red-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          Map Warna: {mapInfo.color} ({mapInfo.code})
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { id: "hasIjazah", label: "IJAZAH / SKL / SUKET KELAS 9" },
                        { id: "hasCopyNisn", label: "FOTO COPY NISN" },
                        { id: "hasRapor", label: "FOTO COPY RAPOR SEMESTER 1-5" },
                        { id: "hasKK", label: "FOTO COPY KARTU KELUARGA" },
                        { id: "hasAkte", label: "FOTO COPY AKTE KELAHIRAN" },
                        { id: "hasKtpOrangTua", label: "FOTO COPY KTP ORANG TUA" },
                        { id: "hasKip", label: "FOTO COPY KIP (Bila ada)" },
                        { id: "hasSertifikat", label: "FOTO COPY SERTIFIKAT PRESTASI (Bila ada)" },
                        { id: "hasFoto", label: "PAS FOTO HITAM PUTIH 3X4 (4 LEMBAR)" },
                      ].map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                          <span className="text-sm font-medium text-slate-700">{item.label}</span>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant={watch(item.id as any) === true ? "default" : "outline"}
                              className={watch(item.id as any) === true ? "bg-green-600 hover:bg-green-700" : "bg-white"}
                              onClick={() => setValue(item.id as any, true)}
                            >
                              Ada
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={watch(item.id as any) === false ? "destructive" : "outline"}
                              className={watch(item.id as any) === false ? "bg-red-600 hover:bg-red-700" : "bg-white"}
                              onClick={() => setValue(item.id as any, false)}
                            >
                              Tidak Ada
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-xl transition-all shadow-lg hover:shadow-blue-200 flex items-center justify-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Kirim Pendaftaran
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="bg-slate-50/50 border-t border-slate-100 py-4 rounded-b-xl flex justify-center">
                <p className="text-xs text-slate-400">© 2026 SMK Negeri 1 Lalan. All rights reserved.</p>
              </CardFooter>
            </Card>
          )}
        </motion.div>
        )}
      </main>
    </div>
  );
}
