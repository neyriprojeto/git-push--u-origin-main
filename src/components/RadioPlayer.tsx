'use client';

export function RadioPlayer() {
  const radioUrl = "https://player.hdradios.net/player-topo-html5/6874/4c7cf3";

  return (
    <div className="sticky top-0 z-50 w-full bg-card shadow-md">
        <iframe
          src={radioUrl}
          frameBorder="0"
          width="100%"
          height="65"
          allow="autoplay"
          title="Rádio Player"
        ></iframe>
    </div>
  );
}
