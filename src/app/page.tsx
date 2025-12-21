import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="glass rounded-3xl p-8 md:p-12 max-w-2xl w-full shadow-2xl">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Overmarksgården Intra
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Sammenværd, Tryghed, Udvikling
        </p>
        
        <div className="space-y-4">
          <Link 
            href="/beboer"
            className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 text-center min-h-[48px] flex items-center justify-center"
          >
            Beboer Login
          </Link>
          
          <Link 
            href="/personale"
            className="block w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 text-center min-h-[48px] flex items-center justify-center"
          >
            Personale Login
          </Link>
        </div>
      </div>
    </div>
  );
}
