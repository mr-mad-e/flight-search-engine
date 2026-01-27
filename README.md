# Flight Search Engine

A modern, responsive flight search application built with Next.js 16, TypeScript, and Tailwind CSS. This application allows users to search for flights, filter results with granular precision, view price trends, and compare different flight options.

## Features

- **Flight Search**: Search for flights by origin, destination, date, passengers, and cabin class.
- **Advanced Filtering**: Filter results by:
  - Price range
  - Number of stops
  - Airlines
  - Departure and arrival times
  - Flight duration
- **Interactive Price Graph**: Visualize price trends across different times to find the best deals.
- **Flight Comparison**: Pin multiple flights to compare them side-by-side.
- **Responsive Design**: Fully optimized for both desktop and mobile devices.
- **Accessible UI**: Built using Radix UI primitives for accessibility.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Visualizations**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Date Handling**: [date-fns](https://date-fns.org/)

## Getting Started

### Prerequisites

Ensure you have Node.js installed on your machine.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/flight-search-engine.git
   cd flight-search-engine
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

### Running the Development Server

Start the local development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
flight-search-engine/
├── app/                  # Next.js App Router pages and API routes
├── components/           # React components
│   ├── filters/          # Filter sidebar components
│   ├── graph/            # Price trend visualizations
│   ├── results/          # Flight list and card components
│   ├── search/           # Search form components
│   └── ui/               # Reusable UI primitives
├── lib/                  # Utilities and business logic
│   ├── hooks/            # Custom React hooks
│   ├── stores/           # Global state stores (Zustand)
│   ├── types/            # TypeScript definitions
│   └── utils/            # Helper functions
└── public/               # Static assets
```

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/)
