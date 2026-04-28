import React, { useEffect, useState, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Website design data - extracted from webSites folder HTML files
const websiteDesigns = [
  {
    id: 1,
    title: "",
    folder: "dizayn 1",
    ogImage: "/webSites/background/1/dizayn%201.png",
  },
  {
    id: 2,
    title: "",
    folder: "dizayn 2",
    ogImage: "/webSites/background/2/dizayn%202.png",
  },
  {
    id: 3,
    title: "Firdavs & Farangiz",
    folder: "dizayn 3",
    ogImage: "/webSites/background/3/dizayn%203.png",
  },
  {
    id: 4,
    title: "Isfandiyorbek & Kamilaxon",
    folder: "dizayn 4",
    ogImage: "/webSites/background/4/dizayn%204.png",
  },
  {
    id: 5,
    title: "Timur & Nasiba",
    folder: "dizayn 5",
    ogImage: "/webSites/background/5/dizayn%20%205.png",
  },
  {
    id: 6,
    title: "Jaxongir & Diyora",
    folder: "dizayn 6",
    ogImage: "/webSites/background/6/dizayn%206.png",
  },
  {
    id: 7,
    title: "Muxammaddiyor & Shaxnoza",
    folder: "dizayn 7",
    ogImage: "/webSites/background/7/dizayn%207.png",
  },
  {
    id: 8,
    title: "Muhammad Rishod & Sevara",
    folder: "dizayn 8",
    ogImage: "/webSites/background/8/dizayn%208.png",
  },
  {
    id: 9,
    title: "Sardor & Munisa",
    folder: "dizayn 9",
    ogImage: "/webSites/background/9/dizayn%209.png",
  },
  {
    id: 10,
    title: "Davlat & Safina",
    folder: "dizayn 10",
    ogImage: "/webSites/background/10/dizayn%2010.png",
  },
  {
    id: 11,
    title: "Nurmuxammad & Mexribon",
    folder: "dizayn 11",
    ogImage: "/webSites/background/11/dizayn%2011.png",
  },
];

const DesignCard = ({ design, index }: { design: any, index: number }) => {
  const [inView, setInView] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const getBackgroundPath = (folderName: string) => {
    const id = folderName.split(' ')[1];
    const fileName = folderName === 'dizayn 5' ? 'dizayn  5' : folderName;
    return encodeURI(`/webSites/background/${id}/${fileName}.png`);
  };

  const getScreenshotPath = (folderName: string, fileName: string) => {
    return encodeURI(`/webSites/screenshots/${folderName}/${fileName}`);
  };

  return (
    <div
      ref={cardRef}
      className={`flex flex-col items-center transition-all duration-1000 ease-out ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}
      style={{ transitionDelay: `${(index % 3) * 100}ms` }}
    >
      {/* Premium Mockup Card with Deep Shadow (Soya) */}
      <div
        className="w-full aspect-[4/3] relative rounded-[40px] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] hover:shadow-[0_70px_120px_-25px_rgba(0,0,0,0.7)] transition-all duration-700 mb-8 group cursor-pointer border border-gray-100/50 hover:-translate-y-3"
        onClick={() => window.location.href = `/webSites/${design.folder}/index.html`}
      >
        {/* Background Image */}
        <div className="absolute inset-0 w-full h-full transition-transform duration-1000 group-hover:scale-110">
          <img
            src={getBackgroundPath(design.folder)}
            onError={(e) => {
              (e.target as HTMLImageElement).src = design.ogImage;
            }}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500"></div>
        </div>

        {!design.hideScreenshots && (
          <>
            {/* Perspective Phones (Left/Center) */}
            <div
              className="absolute top-[8%] left-[0%] w-[55%] z-10 pointer-events-none opacity-0"
              style={{
                animation: inView ? `phoneAppearLeft 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) 400ms forwards` : 'none',
              }}
            >
              <img
                src={getScreenshotPath(design.folder, "iPhone 15 Mockup, Perspective.png")}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (!img.src.includes("(1).png")) {
                    img.src = getScreenshotPath(design.folder, "iPhone 15 Mockup, Perspective (1).png");
                  }
                }}
                alt=""
                className="w-full h-auto drop-shadow-[0_35px_45px_rgba(0,0,0,0.4)]"
              />
            </div>

            {/* Close Up Phone (Right/Foreground) */}
            <div
              className="absolute bottom-[0%] right-[10%] w-[40%] z-20 pointer-events-none opacity-0"
              style={{
                animation: inView ? `phoneAppearRight 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) 800ms forwards` : 'none',
              }}
            >
              <img
                src={getScreenshotPath(design.folder, "iPhone 15 Mockup Close Up Poster Freepik (1).png")}
                alt=""
                className="w-full h-auto drop-shadow-[0_40px_60px_rgba(0,0,0,0.5)]"
              />
            </div>
          </>
        )}

        {/* Hover Light Reflection */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
      </div>

      {/* Info & Buttons */}
      <div className="w-full flex flex-col items-center">
        <div className="flex items-center justify-center gap-4 w-full max-w-[320px]">
          <a
            href={`/webSites/${design.folder}/index.html`}
            className="flex-1 py-4 px-6 bg-white hover:bg-gray-50 text-gray-900 text-[12px] font-black rounded-full border border-gray-100 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] transition-all duration-300 text-center uppercase tracking-[0.2em] active:scale-95 hover:-translate-y-1"
          >
            Ko'rish
          </a>
          <a
            href="https://t.me/+998993955537"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-4 px-6 bg-black hover:bg-gray-800 text-white text-[12px] font-black rounded-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] transition-all duration-300 text-center uppercase tracking-[0.2em] active:scale-95 hover:-translate-y-1"
          >
            Buyurtma
          </a>
        </div>
      </div>
    </div>
  );
};

export const WebsitesPage: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#fdfdfd] flex flex-col relative overflow-y-auto">
      <style>{`
        @keyframes phoneAppearLeft {
          0% { transform: translate(-80px, 60px) rotate(-15deg) scale(0.8); opacity: 0; }
          100% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
        }
        @keyframes phoneAppearRight {
          0% { transform: translate(100px, 80px) rotate(15deg) scale(0.7); opacity: 0; }
          100% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
        }
      `}</style>
      {/* Header */}
      <header className="w-full flex items-center justify-between px-10 py-8 z-30 sticky top-0 bg-white/60 backdrop-blur-2xl border-b border-gray-100/50">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-4 text-gray-400 hover:text-gray-900 transition-all duration-500 group"
        >
          <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100 group-hover:shadow-xl group-hover:-translate-x-1 transition-all duration-500">
            <ArrowLeft size={24} strokeWidth={1.5} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] hidden sm:inline">Back</span>
        </button>

        <div className="absolute left-1/2 -translate-x-1/2 text-center">
          <h1 className="text-gray-900 text-[10px] font-black tracking-[0.4em] uppercase opacity-90">
            Web taklifnomalar
          </h1>
          <div className="h-[3px] w-6 bg-black mx-auto mt-3 rounded-full opacity-10"></div>
        </div>

        <div className="w-14" />
      </header>

      {/* Main Content Grid */}
      <div className={`w-full max-w-[1400px] mx-auto px-8 py-16 pb-32 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 lg:gap-24">
          {websiteDesigns.map((design, index) => (
            <DesignCard key={design.id} design={design} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

