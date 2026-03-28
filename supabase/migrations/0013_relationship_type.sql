-- 0013_relationship_type.sql
-- Structured relationship type for filtering and context (complements free-text relation_label)

ALTER TABLE people
  ADD COLUMN IF NOT EXISTS relationship_type text
    CHECK (relationship_type IN (
      'family', 'partner', 'child', 'parent', 'sibling',
      'friend', 'colleague', 'acquaintance', 'other'
    ));
