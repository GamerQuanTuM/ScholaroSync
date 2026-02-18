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

> **Note on Alignment:** This mapping perfectly aligns with the standard Scholaro 10-point scale conversion. For example, MAKAUT's **E (9 points)** maps to **4.0 (A+)**, **B (7 points)** maps to **3.0 (B+)**, and **D (5 points)** maps to **2.0 (C/P)** on the US scale. The grade points are mathematically identical.

### How the Conversion Works

> **Key Principle:** The conversion is performed at the **individual subject grade level**, not by mathematically scaling the final CGPA or DGPA. Each subject's letter grade is independently mapped to its 4.0 equivalent, and all subsequent aggregations (SGPA, YGPA, DGPA) use the same MAKAUT formulas on the converted values.

The app runs **two independent, parallel pipelines** from the same subject grades:

```
Subject grades + credits ──→ 10-scale GPs ──→ SGPA(10) ──→ YGPA(10) ──→ DGPA(10)
                          └─→ 4.0-scale GPs ──→ SGPA(4.0) ──→ YGPA(4.0) ──→ DGPA(4.0)
```

The 10-scale and 4.0-scale results are **not derived from each other** — they are both computed from scratch using the same raw grades but different grade point maps.

---

### 1️⃣ SGPA (Semester GPA)

For each semester, compute the Credit Index and divide by total credits:

```
Credit Index (CI) = Σ (Grade Point × Credits)  for each subject
SGPA = CI / Total Credits
```

#### Worked Example — Semester with 3 subjects:

| Subject | Credits | Grade | GP (10) | GP (4.0) | CI (10) | CI (4.0) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Data Structures | 4 | **O** | 10 | 4.0 | 40 | 16.0 |
| Mathematics | 4 | **A** | 8 | 3.5 | 32 | 14.0 |
| Economics | 2 | **B** | 7 | 3.0 | 14 | 6.0 |
| **TOTAL** | **10** | | | | **86** | **36.0** |

```
SGPA(10)  = 86 / 10 = 8.60
SGPA(4.0) = 36 / 10 = 3.60
```

> Both values come from the **same grades** — just different GP maps. Neither is derived from the other.

---

### 2️⃣ YGPA (Yearly GPA)

Combine the two semesters of each academic year using **credit-weighted** aggregation (not a simple average of SGPAs):

```
YGPA = (CI_odd_semester + CI_even_semester) / (Credits_odd + Credits_even)
```

#### Worked Example — First Year results:

| Semester | SGPA | Total Credits | Credit Index (CI) |
| :--- | :---: | :---: | :---: |
| Sem 1 | 6.20 | 10 | 62.0 |
| Sem 2 | 6.50 | 14 | 91.0 |
| **Year Total** | - | **24** | **153.0** |

**Calculation:**
`Total CI (153.0)` / `Total Credits (24)` = **6.375 YGPA**

> **Note:** A simple average `(6.2 + 6.5) / 2` would be **6.35**. Because Sem 2 carried more credits (14 vs 10), it had a greater impact on the final YGPA. This same logic applies to both the 10-scale and 4.0-scale calculations.

---

### 3️⃣ DGPA (Degree GPA) — MAKAUT Weighted Formula

The final DGPA uses the **official MAKAUT weighted formula** where later years carry more weight:

| Year | Semesters | Weight | Rationale |
| :--- | :--- | :---: | :--- |
| 1st Year | Sem 1, Sem 2 | **×1.0** | Foundation year |
| 2nd Year | Sem 3, Sem 4 | **×1.0** | Foundation year |
| 3rd Year | Sem 5, Sem 6 | **×1.5** | Higher academic rigor |
| 4th Year | Sem 7, Sem 8 | **×1.5** | Higher academic rigor |
| | | **Σ = 5.0** | |

```
DGPA = (YGPA₁ × 1.0 + YGPA₂ × 1.0 + YGPA₃ × 1.5 + YGPA₄ × 1.5) / 5.0
```

This formula is applied **independently** on both scales:

```
DGPA(10)  = (YGPA₁(10)×1.0  + YGPA₂(10)×1.0  + YGPA₃(10)×1.5  + YGPA₄(10)×1.5)  / 5.0
DGPA(4.0) = (YGPA₁(4.0)×1.0 + YGPA₂(4.0)×1.0 + YGPA₃(4.0)×1.5 + YGPA₄(4.0)×1.5) / 5.0
```

#### Worked Example — Full DGPA:

| Year | YGPA (10) | YGPA (4.0) | Weight | Weighted (10) | Weighted (4.0) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| 1st | 7.40 | 2.95 | ×1.0 | 7.40 | 2.95 |
| 2nd | 7.50 | 3.00 | ×1.0 | 7.50 | 3.00 |
| 3rd | 7.70 | 3.10 | ×1.5 | 11.55 | 4.65 |
| 4th | 7.80 | 3.15 | ×1.5 | 11.70 | 4.725 |
| **Sum** | | | **5.0** | **38.15** | **15.325** |

```
DGPA(10)  = 38.15  / 5.0 = 7.63
DGPA(4.0) = 15.325 / 5.0 = 3.07
```

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
