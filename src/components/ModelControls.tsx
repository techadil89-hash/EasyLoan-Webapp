'use client';

import React from 'react';
import { Sliders, Activity, Compass } from 'lucide-react';
import { KNNConfig } from '../lib/types';

interface ModelControlsProps {
  config: KNNConfig;
  onChange: (config: KNNConfig) => void;
  totalTrainingSamples: number;
}

export const ModelControls: React.FC<ModelControlsProps> = ({
  config,
  onChange,
}) => {
  return (
    <div className="tuning-toolbar">
      <div className="tuning-unit">
        <Sliders size={16} style={{ color: 'var(--brand-primary)' }} />
        <span className="tuning-unit-title">K Neighbors:</span>
        <div className="k-slider-control">
          <input
            type="range"
            min={1}
            max={15}
            step={2}
            value={config.k}
            onChange={(e) => onChange({ ...config, k: parseInt(e.target.value, 10) })}
            className="modern-slider"
            id="k-value-slider"
          />
          <span className="k-chip">K = {config.k}</span>
        </div>
      </div>

      <div className="tuning-unit">
        <Compass size={16} style={{ color: 'var(--brand-blue)' }} />
        <span className="tuning-unit-title">Metric:</span>
        <div className="ios-tabs">
          <button
            type="button"
            className={`ios-tab-btn ${config.metric === 'euclidean' ? 'active' : ''}`}
            onClick={() => onChange({ ...config, metric: 'euclidean' })}
            id="metric-euclidean-btn"
          >
            Euclidean (L2)
          </button>
          <button
            type="button"
            className={`ios-tab-btn ${config.metric === 'manhattan' ? 'active' : ''}`}
            onClick={() => onChange({ ...config, metric: 'manhattan' })}
            id="metric-manhattan-btn"
          >
            Manhattan (L1)
          </button>
        </div>
      </div>

      <div className="tuning-unit">
        <Activity size={16} style={{ color: 'var(--brand-primary)' }} />
        <span className="tuning-unit-title">Distance Weight:</span>
        <div className="ios-tabs">
          <button
            type="button"
            className={`ios-tab-btn ${config.weighted ? 'active' : ''}`}
            onClick={() => onChange({ ...config, weighted: true })}
            id="weight-inverse-btn"
          >
            Inverse Distance
          </button>
          <button
            type="button"
            className={`ios-tab-btn ${!config.weighted ? 'active' : ''}`}
            onClick={() => onChange({ ...config, weighted: false })}
            id="weight-uniform-btn"
          >
            Uniform Voting
          </button>
        </div>
      </div>
    </div>
  );
};
