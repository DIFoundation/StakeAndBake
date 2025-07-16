// components/FnftCard.tsx
import Image from 'next/image';

export default function FnftCard({ title, value, staked, rewards, image }: {
  title: string;
  value: string;
  staked: string;
  rewards: string;
  image: string;
}) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start gap-6 bg-[#18181B]/80 p-6 rounded-xl border border-[#2a2a2a]">
      <div>
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <ul className="text-gray-300 space-y-1 text-sm">
          <li><strong>Current Value:</strong> {value}</li>
          <li><strong>Original Staked Amount:</strong> {staked}</li>
          <li><strong>Accumulated Rewards:</strong> {rewards}</li>
        </ul>
      </div>
      <Image
        src={image}
        alt={title}
        width={150}
        height={100}
        className="rounded-md object-cover"
      />
    </div>
  );
}
