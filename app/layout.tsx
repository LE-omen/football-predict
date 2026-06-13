import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AppHeader from '../components/AppHeader';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '足球积分预测',
  description: '好友之间的世界杯赛果预测积分站',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} min-h-screen bg-white text-gray-900 antialiased`}>
        <AppHeader />
        <main className="min-h-[calc(100vh-120px)]">{children}</main>
        <footer className="border-t border-gray-200 bg-gray-50 py-6 text-center text-xs text-gray-400">
          <div className="mx-auto max-w-3xl px-4">
            本站为朋友间娱乐性质的足球赛果预测积分站，不提供任何充值、提现、购彩、兑奖、奖品兑换或现金结算服务。站内积分仅为虚拟娱乐积分，不具备现金价值。
          </div>
        </footer>
      </body>
    </html>
  );
}