import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Website design data - extracted from webSites folder HTML files
const websiteDesigns = [
  {
    id: 1,
    title: "Doston & Fariza",
    folder: "dizayn 1",
    ogImage: "https://static.tildacdn.one/tild3866-3037-4135-a266-306331323366/photo.JPG",
  },
  {
    id: 2,
    title: "Azam & Farida",
    folder: "dizayn 2",
    ogImage: "https://static.tildacdn.one/tild3739-6166-4763-a264-643430353966/photo.jpg",
  },
  {
    id: 3,
    title: "Firdavs & Farangiz",
    folder: "dizayn 3",
    ogImage: "https://static.tildacdn.one/tild6366-3136-4131-b861-333332383564/55.jpg",
  },
  {
    id: 4,
    title: "Isfandiyorbek & Kamilaxon",
    folder: "dizayn 4",
    ogImage: "https://static.tildacdn.one/tild6338-3761-4365-a237-656435333434/photo.JPG",
  },
  {
    id: 5,
    title: "Timur & Nasiba",
    folder: "dizayn 5",
    ogImage: "https://static.tildacdn.one/tild3531-3165-4033-b431-623235626139/TN.jpg",
  },
  {
    id: 6,
    title: "Jaxongir & Diyora",
    folder: "dizayn 6",
    ogImage: "https://static.tildacdn.one/tild3262-3232-4563-b531-323561353962/0604.jpg",
  },
  {
    id: 7,
    title: "Muxammaddiyor & Shaxnoza",
    folder: "dizayn 7",
    ogImage: "https://static.tildacdn.one/tild6131-6335-4162-b561-363731636335/5X5.jpg",
  },
  {
    id: 8,
    title: "Muhammad Rishod & Sevara",
    folder: "dizayn 8",
    ogImage: "https://static.tildacdn.one/tild6339-3032-4135-a165-393837363666/photo_2025-04-25_23-.jpg",
  },
  {
    id: 9,
    title: "Sardor & Munisa",
    folder: "dizayn 9",
    ogImage: "https://static.tildacdn.one/tild3037-3830-4235-a663-383635643461/5x5_2404-12.jpg",
  },
  {
    id: 10,
    title: "Davlat & Safina",
    folder: "dizayn 10",
    ogImage: "https://static.tildacdn.one/tild3061-6639-4531-a564-356436323465/obloj_2.jpg",
  },
  {
    id: 11,
    title: "Nurmuxammad & Mexribon",
    folder: "dizayn 11",
    ogImage: "https://static.tildacdn.one/tild6437-3734-4764-b861-646565393863/0504.jpg",
  },
];

export const WebsitesPage: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] flex flex-col relative overflow-y-auto">
      {/* Header */}
      <header className="w-full flex items-center justify-between px-6 py-4 z-20 sticky top-0 bg-[#f8f9fa]/80 backdrop-blur-md">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-all duration-300 group"
        >
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100 group-hover:shadow-md transition-all duration-300">
            <ArrowLeft size={18} strokeWidth={2} />
          </div>
          <span className="text-sm font-medium tracking-wide hidden sm:inline">Orqaga</span>
        </button>

        <div className="text-center">
          <h1 className="text-gray-900 text-sm font-bold tracking-[0.2em] uppercase">
            WebSite Taklifnomalar
          </h1>
        </div>

        <div className="w-10" />
      </header>

      {/* Main Content Grid */}
      <div className={`w-full max-w-7xl mx-auto px-4 py-8 pb-20 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {websiteDesigns.map((design, index) => (
            <div 
              key={design.id} 
              className="flex flex-col items-center"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both'
              }}
            >
              {/* Image Card */}
              <div className="w-full aspect-[4/3] rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 mb-5 bg-white group cursor-pointer">
                <img
                  src={design.ogImage}
                  alt={design.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                  onClick={() => window.location.href = `/webSites/${design.folder}/index.html`}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-4 w-full px-4">
                <a
                  href={`/webSites/${design.folder}/index.html`}
                  className="flex-1 py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-800 text-sm font-medium rounded-xl border border-gray-200 transition-all duration-300 text-center uppercase tracking-wide hover:shadow-sm"
                >
                  Ko'rish
                </a>
                <a
                  href="https://t.me/+998993955537"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 bg-black hover:bg-gray-900 text-white text-sm font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-center uppercase tracking-wide"
                >
                  Buyurtma
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
