/**
 * Graphics Library — Barrel export.
 * 
 * Import everything from this file:
 *   import { PixelRenderer, ParticleSystem, VFXLibrary, SpriteAnimator } from '../graphics';
 */

export { PixelRenderer } from './PixelRenderer';
export type { PixelGrid, ColorPalette } from './PixelRenderer';

export { ParticleSystem } from './ParticleSystem';
export type { Particle } from './ParticleSystem';

export { VFXLibrary } from './VFXLibrary';

export { SpriteAnimator } from './SpriteAnimator';
export type { GlowPoint } from './SpriteAnimator';

// Sprite data
export { HERO_SPRITES } from './sprites/HeroSprites';
export type { HeroSpriteSet } from './sprites/HeroSprites';

export { MONSTER_SPRITES, getMonsterForLevel } from './sprites/MonsterSprites';
export type { MonsterSpriteData } from './sprites/MonsterSprites';

export { NPC_SPRITES } from './sprites/NPCSprites';
export type { NPCSpriteData } from './sprites/NPCSprites';

export { BATTLE_ITEM_ICONS, SHOP_ITEM_ICONS, getBattleItemIcon, getShopItemIcon } from './sprites/ItemIcons';
export type { ItemIconData } from './sprites/ItemIcons';
