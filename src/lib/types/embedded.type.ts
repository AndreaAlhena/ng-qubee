/**
 * Embedded-resource selection map (PostgREST only)
 *
 * Maps a related table / foreign-key name (as PostgREST sees it) to the
 * columns to project from it. An empty array means "all columns" and
 * emits `relation(*)`; a non-empty array emits `relation(col1,col2)`.
 * The PostgREST request strategy splices these fragments into the single
 * `select=` query parameter alongside flat columns from `addSelect`.
 */
export type Embedded = {
  [relation: string]: string[];
};
