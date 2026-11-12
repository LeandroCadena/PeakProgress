-- Run after 20261111230000_catalog_spanish_exercises.sql.
-- Stable IDs make this pilot safe to rerun after adding images or muscle links.
BEGIN;

INSERT INTO public.exercises (
    id, name, name_es, equipment, difficulty, is_active,
    description, description_es, instructions, instructions_es, tips, tips_es
)
VALUES
    (
        'd8091b77-a676-473f-986d-b51a330bc111',
        'Bodyweight Squat', 'Sentadilla con peso corporal', 'Bodyweight', 'Beginner', true,
        'A squat performed without external load.',
        'Sentadilla realizada sin carga externa.',
        'Stand with your feet about shoulder-width apart. Bend your hips and knees to lower, then push through your feet to stand up.',
        'Parate con los pies aproximadamente al ancho de los hombros. Flexioná la cadera y las rodillas para bajar y empujá el piso con los pies para volver a subir.',
        'Keep your heels on the floor and let your knees follow the direction of your toes.',
        'Mantené los talones apoyados y dejá que las rodillas sigan la dirección de los pies.'
    ),
    (
        'd8091b77-a676-473f-986d-b51a330bc112',
        'Dumbbell Bench Press', 'Press de banca con mancuernas', 'Dumbbell', 'Beginner', true,
        'A horizontal press performed with two dumbbells on a flat bench.',
        'Empuje horizontal con dos mancuernas sobre un banco plano.',
        'Lie on a flat bench with your feet on the floor. Start with the dumbbells near your chest and press them upward. Lower them under control.',
        'Acostate en un banco plano con los pies apoyados. Empezá con las mancuernas cerca del pecho, empujalas hacia arriba y bajalas de forma controlada.',
        'Keep your wrists stacked over your forearms throughout the press.',
        'Mantené las muñecas alineadas con los antebrazos durante el movimiento.'
    ),
    (
        'd8091b77-a676-473f-986d-b51a330bc113',
        'Barbell Bent-Over Row', 'Remo inclinado con barra', 'Barbell', 'Intermediate', true,
        'A barbell row performed with the torso inclined forward.',
        'Remo con barra realizado con el torso inclinado hacia adelante.',
        'Soften your knees and hinge at the hips. Pull the bar toward your lower ribs, then lower it until your arms are extended.',
        'Flexioná levemente las rodillas e incliná el torso desde la cadera. Llevá la barra hacia las costillas bajas y bajala hasta extender los brazos.',
        'Keep the torso steady as the bar moves.',
        'Mantené el torso estable mientras movés la barra.'
    ),
    (
        'd8091b77-a676-473f-986d-b51a330bc114',
        'Rope Triceps Pushdown', 'Extensión de tríceps en polea con cuerda', 'Cable', 'Beginner', true,
        'An elbow extension performed with a rope attachment on a high pulley.',
        'Extensión de codos con una cuerda conectada a una polea alta.',
        'Stand facing the pulley with your elbows close to your sides. Push the rope down until your elbows extend, then return slowly.',
        'Parate frente a la polea con los codos cerca del cuerpo. Empujá la cuerda hacia abajo hasta extender los codos y volvé lentamente.',
        'Keep your upper arms steady and avoid leaning into each repetition.',
        'Mantené la parte superior de los brazos quieta y evitá inclinar el torso en cada repetición.'
    )
ON CONFLICT (id) DO NOTHING;

COMMIT;
