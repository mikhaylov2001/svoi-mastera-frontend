import React from 'react';

/** Блок «Сейчас на платформе» в hero заказчика и мастера. */
export default function PlatformLiveCard({ visibleFeed, stats }) {
  return (
    <aside className="chpv-livecard">
      <div className="chpv-live-head">
        <span className="chpv-live-title">Сейчас на платформе</span>
        <span className="chpv-live-online">Онлайн</span>
      </div>
      <div className="chpv-feed">
        {visibleFeed.map((f) => (
          <div className="chpv-feed-row" key={f._k}>
            <div className="chpv-feed-ava" style={{ background: f.color }}>
              {(f.who && f.who[0]) || '·'}
            </div>
            <div className="chpv-feed-text">
              <b>{f.who}</b> {f.what}
            </div>
            <div className="chpv-feed-time">{f.time}</div>
          </div>
        ))}
      </div>
      <div className="chpv-mini-stats">
        {stats.map((stat) => (
          <div className="chpv-mini-stat" key={stat.label}>
            <b>{stat.value}</b>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
