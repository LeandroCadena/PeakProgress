import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const [projectUrl, bucket = 'exercise-media'] = process.argv.slice(2);
if (!projectUrl) throw new Error('Usage: node supabase/scripts/generate-catalog-import.mjs https://<project>.supabase.co [bucket]');
const url = new URL(projectUrl);
if (url.protocol !== 'https:' || url.href !== url.origin + '/' || !/^[a-zA-Z0-9_-]+$/.test(bucket)) {
    throw new Error('Provide an HTTPS project origin and a valid bucket name');
}

const catalog = JSON.parse(readFileSync(new URL('../catalog/exercises.json', import.meta.url), 'utf8'));
const exercises = Object.values(catalog).flat();
if (new Set(exercises.map(({ id }) => id)).size !== exercises.length) {
    throw new Error('Duplicate exercise IDs');
}

const aliases = {
    Abdominales: ['Abdominals', 'Rectus abdominis', 'Abs'],
    Aductores: ['Adductors', 'Hip adductors'],
    Antebrazos: ['Forearms'],
    Braquial: ['Brachialis'],
    Braquiorradial: ['Brachioradialis'],
    Bíceps: ['Biceps', 'Biceps brachii'],
    Cuádriceps: ['Quadriceps', 'Quads'],
    'Deltoides anterior': ['Anterior deltoid', 'Front delts'],
    'Deltoides lateral': ['Lateral deltoid', 'Side delts', 'Medial deltoid'],
    'Deltoides posterior': ['Posterior deltoid', 'Rear delts'],
    'Dorsal ancho': ['Latissimus dorsi', 'Lats'],
    'Elevador de la escápula': ['Levator scapulae'],
    'Erectores espinales': ['Spinal erectors', 'Erector spinae'],
    'Flexores de cadera': ['Hip flexors'],
    Gastrocnemio: ['Gastrocnemius'],
    'Glúteo mayor': ['Gluteus maximus'],
    'Glúteo medio': ['Gluteus medius'],
    'Glúteo menor': ['Gluteus minimus'],
    Infraespinoso: ['Infraspinatus'],
    Isquiotibiales: ['Hamstrings'],
    Oblicuos: ['Obliques'],
    'Pectoral mayor': ['Pectoralis major'],
    'Redondo mayor': ['Teres major'],
    'Redondo menor': ['Teres minor'],
    Romboides: ['Rhomboids'],
    Supraespinoso: ['Supraspinatus'],
    Sóleo: ['Soleus'],
    'Tensor de la fascia lata': ['Tensor fasciae latae', 'Tensor fascia lata'],
    'Tibial posterior': ['Tibialis posterior'],
    Trapecio: ['Trapezius', 'Traps'],
    Tríceps: ['Triceps', 'Triceps brachii'],
};

const musclesByRegion = {
    Arms: ['Antebrazos', 'Braquial', 'Braquiorradial', 'Bíceps', 'Tríceps'],
    Back: ['Dorsal ancho', 'Elevador de la escápula', 'Erectores espinales', 'Redondo mayor', 'Romboides', 'Trapecio'],
    Chest: ['Pectoral mayor'],
    Core: ['Abdominales', 'Oblicuos'],
    Glutes: ['Glúteo mayor', 'Glúteo medio', 'Glúteo menor'],
    Legs: ['Aductores', 'Cuádriceps', 'Flexores de cadera', 'Gastrocnemio', 'Isquiotibiales', 'Sóleo', 'Tensor de la fascia lata', 'Tibial posterior'],
    Shoulders: ['Deltoides anterior', 'Deltoides lateral', 'Deltoides posterior', 'Infraespinoso', 'Redondo menor', 'Supraespinoso'],
};

const muscles = Object.entries(musclesByRegion).flatMap(([region, names]) =>
    names.map((name) => ({
        source_name: name,
        name: aliases[name][0],
        region,
        alternatives: [name, ...aliases[name]],
    })),
);
if (muscles.length !== Object.keys(aliases).length ||
    new Set(muscles.map(({ source_name }) => source_name)).size !== muscles.length) {
    throw new Error('Each muscle must have exactly one region');
}

function literal(value) {
    return "'" + value.replaceAll("'", "''") + "'";
}

const records = exercises.map((exercise) => ({
    ...exercise,
    image_url: `${url.origin}/storage/v1/object/public/${bucket}/exercises/${exercise.id}/cover.webp`,
}));
const links = exercises.flatMap((exercise) =>
    ['primary', 'secondary'].flatMap((role) =>
        exercise[`muscles_${role}`].map((name) => {
            if (!aliases[name]) throw new Error(`Missing aliases for ${name}`);
            const hash = createHash('sha256').update(`${exercise.id}:${name}`).digest('hex');
            const id = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-8${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
            return { id, exercise_id: exercise.id, name, role };
        }),
    ),
);

const columns = ['name', 'name_es', 'equipment', 'difficulty', 'description', 'description_es', 'instructions', 'instructions_es', 'image_url'];
const updateColumns = [...columns, 'is_active'];

const spanishFieldsMigration = readFileSync(
    new URL('../migrations/20261111230000_catalog_spanish_exercises.sql', import.meta.url),
    'utf8',
).trim();

process.stdout.write(`-- Generated from supabase/catalog/exercises.json.
BEGIN;

${spanishFieldsMigration}

CREATE TEMP TABLE import_exercises ON COMMIT DROP AS
SELECT * FROM jsonb_to_recordset(${literal(JSON.stringify(records))}::jsonb)
AS x(id uuid, ${columns.map((name) => `${name} text`).join(', ')});

CREATE TEMP TABLE import_links ON COMMIT DROP AS
SELECT * FROM jsonb_to_recordset(${literal(JSON.stringify(links))}::jsonb)
AS x(id uuid, exercise_id uuid, name text, role text);

CREATE TEMP TABLE import_muscle_definitions ON COMMIT DROP AS
SELECT * FROM jsonb_to_recordset(${literal(JSON.stringify(muscles))}::jsonb)
AS x(source_name text, name text, region text, alternatives jsonb);

LOCK TABLE public.muscles IN SHARE ROW EXCLUSIVE MODE;

INSERT INTO public.muscles (id, name, region_id)
SELECT gen_random_uuid(), d.name, r.id
FROM import_muscle_definitions d
JOIN public.muscle_regions r ON lower(trim(r.name)) = lower(d.region)
WHERE NOT EXISTS (
    SELECT 1
    FROM public.muscles m
    WHERE lower(trim(m.name)) IN (
        SELECT lower(trim(value)) FROM jsonb_array_elements_text(d.alternatives)
    )
)
ORDER BY d.name;

CREATE TEMP TABLE import_muscles ON COMMIT DROP AS
SELECT d.source_name, m.id
FROM import_muscle_definitions d
JOIN public.muscles m ON lower(trim(m.name)) IN (
    SELECT lower(trim(value)) FROM jsonb_array_elements_text(d.alternatives)
);

DO $check$
DECLARE
    unresolved text;
    collisions text;
    missing_covers text;
BEGIN
    SELECT string_agg(name, ', ' ORDER BY name) INTO unresolved
    FROM (
        SELECT l.name
        FROM (SELECT DISTINCT name FROM import_links) l
        LEFT JOIN import_muscles m ON m.source_name = l.name
        GROUP BY l.name
        HAVING count(m.id) <> 1
    ) AS missing_or_ambiguous;
    IF unresolved IS NOT NULL THEN
        RAISE EXCEPTION 'Missing or ambiguous muscle mappings: %', unresolved;
    END IF;

    SELECT string_agg(x.name_es, ', ' ORDER BY x.name_es) INTO missing_covers
    FROM import_exercises x
    WHERE NOT EXISTS (
        SELECT 1 FROM storage.objects o
        JOIN storage.buckets b ON b.id = o.bucket_id AND b.public
        WHERE o.bucket_id = ${literal(bucket)}
          AND o.name = 'exercises/' || x.id::text || '/cover.webp'
    );
    IF missing_covers IS NOT NULL THEN
        RAISE EXCEPTION 'Missing covers in public Storage: %', missing_covers;
    END IF;

    SELECT string_agg(DISTINCT x.name_es, ', ') INTO collisions
    FROM import_exercises x
    JOIN public.exercises e ON e.id <> x.id AND
        (lower(trim(e.name)) = lower(trim(x.name)) OR
         lower(trim(e.name_es)) = lower(trim(x.name_es)));
    IF collisions IS NOT NULL THEN
        RAISE EXCEPTION 'Existing exercises use different IDs: %', collisions;
    END IF;
END
$check$;

INSERT INTO public.exercises AS e (id, ${updateColumns.join(', ')})
SELECT id, ${columns.join(', ')}, true
FROM import_exercises
ORDER BY id
ON CONFLICT (id) DO UPDATE SET
    ${updateColumns.map((name) => `${name} = EXCLUDED.${name}`).join(',\n    ')}
WHERE (${updateColumns.map((name) => `e.${name}`).join(', ')})
    IS DISTINCT FROM (${updateColumns.map((name) => `EXCLUDED.${name}`).join(', ')});

CREATE TEMP TABLE resolved_links ON COMMIT DROP AS
SELECT l.id, l.exercise_id, m.id AS muscle_id, l.role
FROM import_links l
JOIN import_muscles m ON m.source_name = l.name;

UPDATE public.exercise_muscles AS em
SET role = l.role
FROM resolved_links l
WHERE em.exercise_id = l.exercise_id AND em.muscle_id = l.muscle_id
  AND em.role IS DISTINCT FROM l.role;

INSERT INTO public.exercise_muscles (id, exercise_id, muscle_id, role)
SELECT l.id, l.exercise_id, l.muscle_id, l.role
FROM resolved_links l
WHERE NOT EXISTS (
    SELECT 1 FROM public.exercise_muscles em
    WHERE em.exercise_id = l.exercise_id AND em.muscle_id = l.muscle_id
)
ORDER BY l.id
ON CONFLICT (id) DO NOTHING;

SELECT count(*) AS imported_exercises, count(e.image_url) AS linked_covers
FROM public.exercises e JOIN import_exercises x USING (id);
COMMIT;
`);
