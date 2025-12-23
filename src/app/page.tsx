'use client'

import AddAppCard from '@/components/AddAppCard'
import AppListCard from '@/components/AppListCard'
import DictionaryUploadCard from '@/components/DictionaryUploadCard'
import AddSuccessRateCard from '@/components/AddSuccessRateCard'
import RestartDbCard from '@/components/RestartDbCard'

export default function Home() {
  return (
    <main className="min-h-screen p-2 md:p-4 lg:p-5">
      {/* Header with gradient text */}
      <div className="text-center mb-3 md:mb-4 animate-fade-in">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-red-200 drop-shadow-lg">
          Setup Data Grafana
        </h1>
        <p className="text-white/90 text-xs md:text-sm font-medium">
          Manage your application data with ease
        </p>
      </div>

      {/* Bento Box Grid Layout */}
      <div className="max-w-7xl mx-auto">
        {/* Desktop Bento Layout - 2 rows compact */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-2 lg:gap-3" style={{ gridTemplateRows: 'repeat(2, minmax(180px, auto))' }}>
          {/* App List Card - Left side (spans 2 rows) */}
          <div className="lg:col-span-3 lg:row-span-2 animate-fade-in bento-item" style={{ animationDelay: '0.1s' }}>
            <AppListCard />
          </div>

          {/* Add App Card - Top middle */}
          <div className="lg:col-span-3 lg:row-span-1 animate-fade-in bento-item" style={{ animationDelay: '0.2s' }}>
            <AddAppCard />
          </div>

          {/* Dictionary Upload Card - Top right */}
          <div className="lg:col-span-6 lg:row-span-1 animate-fade-in bento-item" style={{ animationDelay: '0.3s' }}>
            <DictionaryUploadCard />
          </div>

          {/* Add Success Rate Card - Bottom middle */}
          <div className="lg:col-span-4 lg:row-span-1 animate-fade-in bento-item" style={{ animationDelay: '0.4s' }}>
            <AddSuccessRateCard />
          </div>

          {/* Restart DB Card - Bottom right */}
          <div className="lg:col-span-5 lg:row-span-1 animate-fade-in bento-item" style={{ animationDelay: '0.5s' }}>
            <RestartDbCard />
          </div>
        </div>

        {/* Tablet Layout - 2 rows */}
        <div className="hidden md:grid lg:hidden md:grid-cols-6 gap-2 md:gap-3" style={{ gridTemplateRows: 'repeat(2, minmax(160px, auto))' }}>
          {/* App List Card - Left side (spans 2 rows) */}
          <div className="md:col-span-2 md:row-span-2 animate-fade-in bento-item" style={{ animationDelay: '0.1s' }}>
            <AppListCard />
          </div>

          {/* Add App Card */}
          <div className="md:col-span-2 md:row-span-1 animate-fade-in bento-item" style={{ animationDelay: '0.2s' }}>
            <AddAppCard />
          </div>

          {/* Dictionary Upload Card */}
          <div className="md:col-span-2 md:row-span-1 animate-fade-in bento-item" style={{ animationDelay: '0.3s' }}>
            <DictionaryUploadCard />
          </div>

          {/* Add Success Rate Card */}
          <div className="md:col-span-2 md:row-span-1 animate-fade-in bento-item" style={{ animationDelay: '0.4s' }}>
            <AddSuccessRateCard />
          </div>

          {/* Restart DB Card */}
          <div className="md:col-span-2 md:row-span-1 animate-fade-in bento-item" style={{ animationDelay: '0.5s' }}>
            <RestartDbCard />
          </div>
        </div>

        {/* Mobile Layout - Stack vertical */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <AppListCard />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <AddAppCard />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <DictionaryUploadCard />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <AddSuccessRateCard />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <RestartDbCard />
          </div>
        </div>
      </div>
    </main>
  )
}

