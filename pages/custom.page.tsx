import { ArrowLeft, Send, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CustomPage = () => {
  const navigate = useNavigate();

  // Telegram URL
  const telegramUrl = `https://t.me/+998993955537?text=${encodeURIComponent(
    "Assalom Aleikum man saytdan taklifnoma buyurtma qilmoqchi edim. O'z rasmlarim bilan."
  )}`;

  return (
    <div className="w-full animate-fade-in pb-10 max-w-md mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#FAF9F6]/80 backdrop-blur-md px-6 py-4 flex items-center gap-4 mb-2 border-b border-stone-100/50">
        <button
          onClick={() => navigate("/")}
          className="p-2 -ml-2 rounded-full hover:bg-stone-100 transition-colors text-stone-600"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-serif font-medium text-stone-800">
          Shaxsiy Dizayn
        </h2>
      </div>

      <div className="px-6 flex flex-col gap-6 pt-4">
        {/* Main Card */}
        <div className="relative overflow-hidden bg-white rounded-3xl p-8 text-center shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-stone-100">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-200 via-rose-200 to-amber-200" />

          <div className="w-20 h-20 mx-auto bg-stone-50 rounded-full flex items-center justify-center mb-6 text-stone-400 ring-4 ring-stone-50 shadow-inner">
            <Camera size={32} strokeWidth={1.5} className="text-stone-600" />
          </div>

          <h3 className="text-xl font-serif text-stone-800 mb-3">
            O‘z rasmlaringiz bilan
          </h3>

          <p className="text-sm text-stone-500 leading-relaxed mb-8">
            Biz sizning rasmlaringizdan foydalanib, unutilmas lahzalar uchun
            eksklyuziv video taklifnoma tayyorlab beramiz.
          </p>

          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 bg-[#229ED9] text-white rounded-xl font-medium text-sm hover:bg-[#1c81b4] transition-all shadow-lg shadow-blue-200/50 flex items-center justify-center gap-3 active:scale-[0.98] no-underline"
          >
            <Send size={18} />
            Rasm jo‘natish (Telegram)
          </a>

          <p className="mt-4 text-[10px] text-stone-400 uppercase tracking-widest">
            Administrator bilan bog‘lanish
          </p>
        </div>

        {/* Info Blocks */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/60 p-4 rounded-2xl border border-stone-100/50">
            <h4 className="font-serif text-stone-800 mb-1">Tezkor</h4>
            <p className="text-xs text-stone-500">
              Buyurtmangiz 24 soat ichida tayyor bo‘ladi
            </p>
          </div>
          <div className="bg-white/60 p-4 rounded-2xl border border-stone-100/50">
            <h4 className="font-serif text-stone-800 mb-1">Sifatli</h4>
            <p className="text-xs text-stone-500">
              Full HD formatdagi premium video
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
