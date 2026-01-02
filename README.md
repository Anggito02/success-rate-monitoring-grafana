# Dashboard Grafana - Next.js

Dashboard untuk manage data success rate Grafana, dibangun dengan Next.js, TypeScript, dan Tailwind CSS.

## 🚀 Migrasi dari Express.js ke Next.js

Project ini telah dimigrasi dari Express.js + Vanilla JavaScript ke Next.js dengan TypeScript untuk struktur yang lebih baik dan maintainability yang lebih tinggi.

### Perubahan Utama:

1. **Framework**: Express.js → Next.js 14 (App Router)
2. **Frontend**: Vanilla JavaScript → React + TypeScript
3. **Styling**: Inline CSS → Tailwind CSS
4. **API Routes**: Express routes → Next.js API routes
5. **Structure**: Flat structure → Organized src/ directory

## 📁 Struktur Project

```
dashboard-grafana/
├── src/
│   ├── app/
│   │   ├── api/              # API routes (Next.js)
│   │   │   ├── applications/
│   │   │   ├── db-status/
│   │   │   ├── restart-db/
│   │   │   ├── upload-dictionary/
│   │   │   └── upload-success-rate/
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page
│   │   └── globals.css       # Global styles
│   ├── components/           # React components
│   │   ├── AddAppCard.tsx
│   │   ├── AddSuccessRateCard.tsx
│   │   ├── AppListCard.tsx
│   │   ├── DictionaryUploadCard.tsx
│   │   └── RestartDbCard.tsx
│   ├── lib/                  # Utilities
│   │   ├── db.ts            # Database connection
│   │   └── multer.ts        # File upload config
│   └── types/               # TypeScript types
│       └── index.ts
├── public/                   # Static files
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 🔧 Setup & Installation

### Prerequisites

- Node.js 18+ 
- MySQL database
- npm or yarn

### Installation Steps

1. **Install dependencies**:
```bash
npm install
```

2. **Setup environment variables**:
Create a `.env.local` file in the root directory:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=grafana_dashboard
```

3. **Initialize database** (optional):
- Gunakan fitur "Restart Database" di aplikasi untuk membuat schema dan tables
- Atau jalankan SQL script secara manual

4. **Run development server**:
```bash
npm run dev
```

5. **Open browser**:
Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Build & Production

### Traditional Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Docker Deployment

Aplikasi ini sudah dilengkapi dengan Docker setup untuk memudahkan deployment.

**Quick Start:**
```bash
# 1. Buat file .env dengan konfigurasi database
# 2. Build dan run dengan Docker Compose
docker-compose up -d --build

# 3. Akses aplikasi di http://localhost:3000
```

**Untuk informasi lengkap tentang Docker setup, lihat [DOCKER.md](./DOCKER.md)**

## 📝 Features

- ✅ **Add New Application**: Tambah aplikasi baru ke database
- ✅ **Application List**: Lihat daftar aplikasi yang terdaftar
- ✅ **Upload Dictionary**: Upload file Excel dengan mapping response code
- ✅ **Upload Success Rate**: Upload file Excel dengan data success rate
- ✅ **Restart Database**: Reset database schema (delete all data)

## 🎨 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MySQL (with mysql2)
- **File Upload**: Native FormData API
- **Excel Processing**: xlsx library

## 📊 Database Schema

### Tables:

1. **app_identifier**: Daftar aplikasi
2. **response_code_dictionary**: Mapping response code untuk setiap aplikasi
3. **app_success_rate**: Data success rate transaksi

## 🔄 Migration Notes

### File Lama (Bisa Dihapus):

- `index.js` - Replaced by Next.js API routes
- `public/index.html` - Replaced by `src/app/page.tsx`
- `public/components/*.js` - Replaced by `src/components/*.tsx`

### Perbedaan API:

API endpoints tetap sama, hanya implementasinya yang berubah:

- `GET /api/applications` → `src/app/api/applications/route.ts`
- `POST /api/applications` → `src/app/api/applications/route.ts`
- `POST /api/restart-db` → `src/app/api/restart-db/route.ts`
- `POST /api/upload-dictionary` → `src/app/api/upload-dictionary/route.ts`
- `POST /api/upload-success-rate` → `src/app/api/upload-success-rate/route.ts`

## 🐛 Troubleshooting

### Database Connection Error

Pastikan:
1. MySQL server running
2. `.env.local` file configured dengan benar
3. Database sudah dibuat (atau gunakan fitur "Restart Database")

### File Upload Error

Pastikan:
1. File format adalah `.xlsx` atau `.xls`
2. Columns sesuai dengan yang dibutuhkan
3. Application sudah dipilih sebelum upload

## 📄 License

ISC

## 👨‍💻 Author

Dashboard Grafana Team - PT Bank BTN

