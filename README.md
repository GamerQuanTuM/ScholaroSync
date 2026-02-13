# ScholaroSync 🎓

ScholaroSync is a professional grade conversion and transcript management tool specifically designed for students of **Maulana Abul Kalam Azad University of Technology (MAKAUT)**, Batch 2017-2021. It facilitates the seamless transition of academic records from the MAKAUT 10-point CGPA system to the international 4.0 GPA standard used by **Scholaro** and other global evaluation services.

## 🚀 The Purpose

For many students applying to universities in the USA, Canada, and Europe, converting Indian university grades into a standard 4.0 scale is a critical step. ScholaroSync automates this process using the accurate mapping guidelines favored by international credential evaluation agencies, helping students visualize their academic standing globally and generate professional transcripts.

## 📊 Conversion Methodology

ScholaroSync uses a verified mapping scale tailored for the MAKAUT grading system. The conversion is based on individual letter grades obtained in each subject, rather than a direct linear conversion of the final CGPA, which ensures greater accuracy in the final GPA calculation.

### Grade Mapping Table

| MAKAUT Grade | Status | 10.0 Scale Points | **Scholaro 4.0 Scale** |
| :--- | :--- | :---: | :---: |
| **O** (Outstanding) | Pass | 10 | **4.0** |
| **E** (Excellent) | Pass | 9 | **4.0** |
| **A** (Very Good) | Pass | 8 | **3.5** |
| **B** (Good) | Pass | 7 | **3.0** |
| **C** (Average) | Pass | 6 | **2.5** |
| **D** (Below Average) | Pass | 5 | **2.0** |
| **F** (Fail) | Fail | 2 | **0.0** |

### Calculation Logic
The final GPA is calculated using the **Weighted Average** method:
1. Each letter grade is converted to its 4.0 value.
2. The value is multiplied by the credits assigned to that subject.
3. The sum of these products is divided by the total number of credits attempted.

### 📝 Step-by-Step Example

Suppose a student has completed a semester with the following results:

| Subject | Credits | MAKAUT Grade | Scholaro Points | Weighted Points (Credits × Points) |
| :--- | :---: | :---: | :---: | :---: |
| Data Structures | 4 | **O** | 4.0 | 16.0 |
| Mathematics | 4 | **A** | 3.5 | 14.0 |
| Economics | 2 | **B** | 3.0 | 6.0 |
| **TOTAL** | **10** | - | - | **36.0** |

**Calculation:**
`Total Weighted Points (36.0)` / `Total Credits (10)` = **3.60 GPA**

## ✨ Key Features

- **Instant Conversion**: Real-time calculation of your 4.0 GPA as you add subjects.
- **Professional PDF Export**: Generate a clean, official-looking transcript formatted for A4 printing, including an authorized signature line.
- **Student Dashboard**: Save multiple transcripts to your account to track your academic progress over different semesters.
- **Modern UI/UX**: Built with a sleek, dark-themed "Glassmorphism" design with smooth animations.
- **Mobile Responsive**: Manage your grades on the go from any device.

## 🛠️ Technical Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Database**: [Prisma](https://www.prisma.io/) with PostgreSQL
- **Styling**: Tailwind CSS 4.0
- **Animations**: Framer Motion
- **Notifications**: Sonner
- **Icons**: Lucide React

## 🛠️ Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/GamerQuanTuM/ScholaroSync.git
   cd scholaro-sync
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/scholaro_sync"
   SESSION_SECRET="your_long_random_secret_string"
   ```

4. **Database Migration**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run Development Server**
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the app in action.

---
*Developed for MAKAUT Students. Disclaimer: This tool is for reference and unofficial transcript generation. Always verify with your institution for official credential evaluation.*
