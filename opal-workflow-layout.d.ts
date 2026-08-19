/**
 * Opal Workflow Layout Engine
 *
 * Pure TypeScript module — no DOM, no network, no side effects.
 * Takes an Opal workflow JSON export and returns the same document with
 * agent_metadata.nodes and agent_metadata.edges rebuilt for a clean canvas layout.
 *
 * Usage:
 *   import { computeLayout, buildOutput, layoutStats } from './opal-workflow-layout';
 *
 *   const layout = computeLayout(workflowDoc, { direction: 'LR' });
 *   const updated = buildOutput(workflowDoc, layout, () => crypto.randomUUID());
 */
export type NodeKind = 'trigger' | 'step' | 'condition';
export type LayoutMode = 'auto' | 'horizontal' | 'vertical' | 'snake' | 'layered';
export type Direction = 'LR' | 'TB';
export interface GraphNode {
    id: string;
    label: string;
    kind: NodeKind;
}
export interface GraphEdge {
    source: string;
    target: string;
}
export interface Graph {
    nodes: GraphNode[];
    edges: GraphEdge[];
    warnings: string[];
}
export interface Point {
    x: number;
    y: number;
}
export interface Size {
    width: number;
    height: number;
}
export interface OutputNode {
    id: string;
    measured: Size;
    position: Point;
}
export interface OutputEdge {
    id: string;
    source: string;
    target: string;
}
export interface LayoutOptions {
    /** Layout algorithm. Default: 'auto' */
    mode?: LayoutMode;
    /** Flow direction for layered / chain layouts. Default: 'TB' */
    direction?: Direction;
    /** Horizontal spacing between nodes (px). Default: 400 */
    xPitch?: number;
    /** Vertical spacing between nodes (px). Default: 240 */
    yPitch?: number;
    /** Number of columns in snake layout. Default: 3 */
    snakeWidth?: number;
}
export interface ExistingMetadata {
    positions: Map<string, Point>;
    measured: Map<string, Size>;
    /** The original agent_metadata object (minus nodes/edges), preserved in output */
    meta: Record<string, unknown> | null;
}
export interface LayoutResult {
    graph: Graph;
    positions: Map<string, Point>;
    sizes: Map<string, Size>;
    existing: ExistingMetadata;
    usedMode: string;
    warnings: string[];
}
export interface LayoutStats {
    overlaps: number;
    crossings: number;
    nodeCount: number;
    edgeCount: number;
}
export declare function buildGraph(doc: Record<string, unknown>): Graph;
export declare function readExistingMetadata(doc: Record<string, unknown>): ExistingMetadata;
export declare function computeLayout(doc: Record<string, unknown>, options?: LayoutOptions): LayoutResult;
export declare function buildOutput(doc: Record<string, unknown>, layout: LayoutResult, uuidFn: () => string): Record<string, unknown>;
export declare function layoutStats(positions: Map<string, Point>, sizes: Map<string, Size>, edges: GraphEdge[]): LayoutStats;
