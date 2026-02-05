/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

import type { Mission } from '@immersive-lang/shared';
import { getMissionIcon } from '@immersive-lang/shared';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';

export interface MissionCardProps {
  mission: Mission;
  onClick?: () => void;
}

export function MissionCard({ mission, onClick }: MissionCardProps) {
  const icon = getMissionIcon(mission.title);

  return (
    <Card variant="interactive" className="cursor-pointer flex flex-col h-full" onClick={onClick}>
      <div className="mb-4 flex justify-between items-start">
        <div className="text-4xl leading-none">{icon}</div>
        <Badge difficulty={mission.difficulty}>{mission.difficulty}</Badge>
      </div>

      <h3 className="m-0 mb-2 text-xl leading-tight font-heading font-bold text-text-main">
        {mission.title}
      </h3>

      <p className="m-0 text-base opacity-70 leading-relaxed text-text-sub">{mission.desc}</p>

      <div className="mt-auto pt-4 text-sm text-accent-secondary font-bold opacity-80">
        Roleplay: {mission.target_role}
      </div>
    </Card>
  );
}
