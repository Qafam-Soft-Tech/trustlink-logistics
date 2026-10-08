import React from 'react';
import { Column, Text, useTheme } from '@trustlink/shared';

export type HeroTone = 'default' | 'success' | 'warning' | 'danger';

/** Large status headline used at the top of the tracking/terminal screens. */
export function HeroStatus({ heading, message, glyph, tone = 'default' }: {
  heading: string;
  message?: string;
  glyph?: string;
  tone?: HeroTone;
}) {
  const { theme } = useTheme();
  const color =
    tone === 'success' ? theme.colors.success
      : tone === 'danger' ? theme.colors.error
        : tone === 'warning' ? theme.colors.warning
          : theme.roles.primaryAction;

  return (
    <Column gap="sm">
      {glyph ? <Text variant="h2" color="inherit" style={{ color }}>{glyph}</Text> : null}
      <Text variant="h1" color="inherit" style={{ color: theme.roles.text }}>{heading}</Text>
      {message ? <Text variant="body" color="inherit" style={{ color: theme.roles.textSecondary }}>{message}</Text> : null}
    </Column>
  );
}
