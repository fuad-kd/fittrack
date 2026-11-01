// ============================================================
// FitTrack Master Exercise & Equipment Library
// Premium data with matched images, YouTube IDs, and step-by-step instructor guides
// ============================================================

export const BODY_PARTS = [
  'All',
  'Chest',
  'Back',
  'Shoulders',
  'Legs',
  'Arms',
  'Core',
  'Cardio'
];

export const LEVELS = [
  { key: 'All', label: 'All Levels' },
  { key: 'Beginner', label: 'Low Level (Beginner)', badgeClass: 'badge-low' },
  { key: 'Intermediate', label: 'Mid Level (Intermediate)', badgeClass: 'badge-mid' },
  { key: 'Advanced', label: 'High Level (Advanced)', badgeClass: 'badge-high' }
];

export const EXERCISE_LIBRARY = [
  // ── CHEST ──
  {
    id: 'ch-1',
    name: 'Seated Chest Press Machine',
    bodyPart: 'Chest',
    level: 'Beginner',
    levelLabel: 'Low Level',
    equipment: 'Chest Press Machine',
    // Gym machine - chest press
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 35,
    tip: 'Keep shoulder blades retracted and press smoothly without locking elbows.',
    youtubeId: 'xUm0BiZCWlQ',
    youtubeUrl: 'https://www.youtube.com/watch?v=xUm0BiZCWlQ',
    targetMuscle: 'Pectoralis Major (Sternal Head)',
    steps: [
      {
        number: 1,
        title: 'Machine Setup & Seat Position',
        instruction: 'Adjust the seat height so the handles align exactly with your mid-chest (nipple line). Your feet should be flat on the floor, hip-width apart. Sit tall with your back pressed firmly against the pad — this protects your spine throughout the movement.',
        cue: 'Think: "Chest to handles, not shoulders to ears."'
      },
      {
        number: 2,
        title: 'Scapular Retraction & Chest Expansion',
        instruction: 'Before gripping the handles, take a deep breath, pinch your shoulder blades together and slightly downward (retraction + depression). This creates a stable shelf for pressing and removes your front deltoids from dominating the movement. Hold this position throughout every single rep.',
        cue: 'Imagine trying to hold a pencil between your shoulder blades.'
      },
      {
        number: 3,
        title: 'The Pressing Phase (Concentric)',
        instruction: 'Exhale as you push the handles away from your chest in a smooth, controlled arc. Drive through your palms. Stop just before your elbows fully lock — keeping a micro-bend preserves joint health and keeps continuous tension on the pectoral muscle fibres.',
        cue: 'Push the handles "through" the machine, not just forward.'
      },
      {
        number: 4,
        title: 'The Return Phase (Eccentric)',
        instruction: 'This is where muscle growth happens. Take 3 full seconds to return the handles back toward your chest. Feel a deep stretch across your pectoral muscles at the bottom position. Do NOT let the weight stack slam down — control is your best training tool.',
        cue: '3 seconds down. 1 second pause. 1 second push. That is your tempo.'
      },
      {
        number: 5,
        title: 'Breathing & Rep Rhythm',
        instruction: 'Inhale during the eccentric (lowering) phase, exhale forcefully during the press. After your final rep, control the handles back to the start position before releasing the safety. Never abruptly let go mid-set.',
        cue: 'Breathe OUT on effort — every single rep, no exceptions.'
      }
    ]
  },
  {
    id: 'ch-2',
    name: 'Pec Deck / Butterfly Machine',
    bodyPart: 'Chest',
    level: 'Beginner',
    levelLabel: 'Low Level',
    equipment: 'Pec Deck Machine',
    // Pec deck / butterfly machine
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 15,
    defaultWeight: 25,
    tip: 'Maintain slight elbow bend and focus on squeezing the inner chest together.',
    youtubeId: 'eGjt4lkGeZ4',
    youtubeUrl: 'https://www.youtube.com/watch?v=eGjt4lkGeZ4',
    targetMuscle: 'Pectoralis Major (Inner Chest & Sternal Head)',
    steps: [
      {
        number: 1,
        title: 'Seat & Arm Pad Adjustment',
        instruction: 'Set the seat height so the arm pads rest at shoulder level when you are seated upright. Your elbows should be directly under your wrists on the pads. The starting position should give you a comfortable, full stretch — not pain. Adjust the range-of-motion stop if your machine has one.',
        cue: 'Elbows at shoulder height = correct alignment.'
      },
      {
        number: 2,
        title: 'Posture & Core Bracing',
        instruction: 'Sit tall with your spine neutral and both feet flat on the floor. Brace your core lightly — imagine a belt tightening around your waist. Keep your head neutral, chin slightly tucked. Your chest should be "proud" — opened and lifted throughout every rep.',
        cue: 'Tall spine, proud chest, tight core.'
      },
      {
        number: 3,
        title: 'The Fly (Concentric Arc)',
        instruction: 'Exhale and bring the pads together in a smooth arc, leading with your elbows. As the pads meet in the centre, squeeze your inner chest as hard as possible. Imagine you are trying to touch your elbows together. Hold the peak contraction for 1-2 seconds for maximum muscle fibre activation.',
        cue: 'Hug a massive tree. Then squeeze it into a sapling.'
      },
      {
        number: 4,
        title: 'Controlled Eccentric Opening',
        instruction: 'Slowly allow the pads to open back out over 3 seconds. Feel a deep, satisfying stretch across the width of your chest at the end range. Do NOT go beyond a comfortable stretch — overstretching the shoulder joint under load is a recipe for injury.',
        cue: 'Control the stretch. Own the range. Never let the weight control you.'
      },
      {
        number: 5,
        title: 'Peak Squeeze Technique',
        instruction: 'On your last 2-3 reps of each set, hold the peak contraction (pads together) for 3 full seconds. This technique, called an "isometric hold," dramatically increases time-under-tension and creates that deep inner-chest burn that drives hypertrophy.',
        cue: 'Last reps: squeeze and hold for 3 seconds. Breathe through it.'
      }
    ]
  },
  {
    id: 'ch-3',
    name: 'Bodyweight Push-Up',
    bodyPart: 'Chest',
    level: 'Beginner',
    levelLabel: 'Low Level',
    equipment: 'Exercise Mat',
    // Man doing push-up
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 15,
    defaultWeight: 0,
    tip: 'Keep your core braced in a straight line from neck to heels.',
    youtubeId: 'IODxDxX7oi4',
    youtubeUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
    targetMuscle: 'Pectoralis Major, Triceps, Anterior Deltoids, Core',
    steps: [
      {
        number: 1,
        title: 'The High Plank Starting Position',
        instruction: 'Place your hands slightly wider than shoulder-width on the mat, fingers pointing forward or slightly outward. Your wrists should be directly below your shoulders. Extend your legs behind you and come onto the balls of your feet. Your body should form a perfectly straight line from your heels through your hips to your head.',
        cue: 'Think: "I am a solid plank of wood — no sag, no peak."'
      },
      {
        number: 2,
        title: 'Full-Body Tension & Core Bracing',
        instruction: 'Before descending, squeeze every muscle in your body: brace your abs hard (like someone is about to punch you), squeeze your glutes, lock your quads. This full-body tension protects your lower back and creates a rigid lever for force transfer. A push-up is a moving plank.',
        cue: 'Tense everything. Your body is one rigid unit.'
      },
      {
        number: 3,
        title: 'The Descent (Eccentric Phase)',
        instruction: 'Inhale and lower your chest toward the floor over 2-3 seconds. Your elbows should travel back at roughly a 45-degree angle from your torso — NOT flared out to 90 degrees (that is a shoulder injury waiting to happen). Lower until your chest is 1-2cm from the floor or your chest gently touches.',
        cue: 'Elbows at 45° back. Chest leads. Hips stay level — always.'
      },
      {
        number: 4,
        title: 'The Press (Concentric Phase)',
        instruction: 'Exhale explosively and drive your hands through the floor, pushing yourself back up. At the top, do not lock your elbows — keep a micro-bend. Focus on "pushing yourself away from the earth" rather than just pushing up. This mental cue activates more chest muscle fibres.',
        cue: 'Push the floor away from you. Do not just raise your body.'
      },
      {
        number: 5,
        title: 'Scapular Movement & Shoulder Health',
        instruction: 'At the very top of each rep, push just a little further to allow your shoulder blades to separate (protract) — this is called a "push-up plus" and is critical for long-term shoulder health. This also activates the serratus anterior, your "boxer muscle," which gives definition to the side of your chest.',
        cue: 'At the top: push a little extra. Round your upper back slightly.'
      }
    ]
  },
  {
    id: 'ch-4',
    name: 'Flat Barbell Bench Press',
    bodyPart: 'Chest',
    level: 'Intermediate',
    levelLabel: 'Mid Level',
    equipment: 'Olympic Bench & Barbell',
    // Barbell bench press
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
    defaultSets: 4,
    defaultReps: 8,
    defaultWeight: 60,
    tip: 'Lower bar with control to mid-chest, drive feet firmly into the floor.',
    youtubeId: 'rT7DgCr-3pg',
    youtubeUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
    targetMuscle: 'Pectoralis Major (Full), Anterior Deltoids, Triceps',
    steps: [
      {
        number: 1,
        title: 'Bench Setup & Body Position',
        instruction: 'Lie on the bench with your eyes directly under the barbell. Plant your feet firmly and flat on the floor (or on weight plates if you are short). Create a natural arch in your lower back — slide your shoulder blades back and down, then pinch them together like you are trying to crack a walnut between them.',
        cue: 'Five points of contact: head, upper back, lower back, both feet. Lock them in.'
      },
      {
        number: 2,
        title: 'Grip Width & Bar Path',
        instruction: 'Grip the bar just outside shoulder width — your forearms should be perfectly vertical when the bar is on your chest. Use a full, thumb-around grip (never a "suicide grip"). The bar should come to your lower sternum / upper-abdomen area, NOT your collarbone, when lowered.',
        cue: 'Vertical forearms at the bottom = correct grip width.'
      },
      {
        number: 3,
        title: 'Unracking & Liftoff',
        instruction: 'Take a deep breath into your belly (not your chest), brace your core hard, and unrack the bar by pushing it straight up. Walk it out over your lower chest with locked arms. Make sure you are stable before beginning your first rep. Have a spotter for heavy sets — always.',
        cue: 'Breathe deep, brace hard, then unrack. Never rush the setup.'
      },
      {
        number: 4,
        title: 'The Descent — Controlled & Arced',
        instruction: 'Inhale fully, brace your whole body, and lower the bar in a very slight arc toward your lower chest / sternum area. Take 2-3 seconds. Keep your elbows tucked at approximately 75 degrees — not flared out, not pinned in. Feel a deep stretch in your pecs at the bottom.',
        cue: 'Touch your lower sternum. Every. Single. Rep.'
      },
      {
        number: 5,
        title: 'The Drive — Leg Drive & Press',
        instruction: 'Without pausing at the bottom for heavy sets, exhale and explode the bar back up and very slightly back (following the same arc). Simultaneously drive your feet into the floor — this leg drive transfers force through your whole body into the bar. Lock out at the top with a strong squeeze before the next rep.',
        cue: 'Push the floor away with your feet as you push the bar away with your hands.'
      }
    ]
  },
  {
    id: 'ch-5',
    name: 'Incline Dumbbell Press',
    bodyPart: 'Chest',
    level: 'Intermediate',
    levelLabel: 'Mid Level',
    equipment: 'Incline Bench & Dumbbells',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 10,
    defaultWeight: 22,
    tip: 'Set bench to 30-35 degrees to bias the clavicular upper chest fibres.',
    youtubeId: '8iPEnn-ltC8',
    youtubeUrl: 'https://www.youtube.com/watch?v=8iPEnn-ltC8',
    targetMuscle: 'Pectoralis Major (Clavicular / Upper Head)',
    steps: [
      {
        number: 1,
        title: 'Bench Angle & Dumbbell Positioning',
        instruction: 'Set the bench to exactly 30-35 degrees incline. Any higher shifts the load from your upper chest to your front shoulders. Sit on the end of the bench, place one dumbbell on each knee, then use your knees to kick the dumbbells up to shoulder level as you lean back. This is the safest technique for loading heavy dumbbells alone.',
        cue: 'Knee-kick technique: safer than swinging from the floor.'
      },
      {
        number: 2,
        title: 'Starting Position',
        instruction: 'With dumbbells at shoulder level, rotate them so your palms face forward (neutral to pronated). Retract and depress your shoulder blades against the pad. Your elbows should be just below shoulder height at the start. Create your arch and root your feet into the floor.',
        cue: 'Shoulder blades glued to the pad. Elbows at about 75-80 degrees from your torso.'
      },
      {
        number: 3,
        title: 'Press & Convergence',
        instruction: 'Exhale and press both dumbbells up and slightly inward in an arc, so they almost (but do not quite) touch at the top. This convergence motion mimics how the upper chest fibres actually contract, giving you a far superior muscle stimulus than the fixed barbell path.',
        cue: 'Press together. Bring the dumbbells toward each other as they go up.'
      },
      {
        number: 4,
        title: 'Slow Descent & Stretch',
        instruction: 'Lower the dumbbells slowly over 3 seconds, allowing your elbows to travel just below the plane of the bench for a deep stretch. Dumbbells should be at your shoulder level and slightly outside at the bottom. Do NOT let the dumbbells drift back behind your head.',
        cue: 'Deep stretch at the bottom = more upper chest activation.'
      },
      {
        number: 5,
        title: 'Dumbbell Advantage — Range of Motion',
        instruction: 'Unlike the barbell, dumbbells allow your arms to move through a greater range of motion and allow individual shoulder-joint adjustment — crucial for long-term health. Take advantage of this by going slightly deeper than you can on a barbell, always within a pain-free range.',
        cue: 'Go deeper than the barbell allows. That is why you chose dumbbells.'
      }
    ]
  },
  {
    id: 'ch-6',
    name: 'Cable Crossover Fly',
    bodyPart: 'Chest',
    level: 'Intermediate',
    levelLabel: 'Mid Level',
    equipment: 'Dual Cable Station',
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 15,
    tip: 'Constant tension throughout the sweep; cross hands slightly for peak contraction.',
    youtubeId: 'taI4XduLpTk',
    youtubeUrl: 'https://www.youtube.com/watch?v=taI4XduLpTk',
    targetMuscle: 'Pectoralis Major (Inner & Lower), Anterior Deltoids',
    steps: [
      {
        number: 1,
        title: 'Cable Height & Starting Position',
        instruction: 'Set both cable pulleys to the high position (above shoulder height). Stand in the centre of the cable station, gripping D-handles in each hand. Step forward about one foot from the weight stacks to create tension at the start. Stagger your feet slightly for balance, with a slight forward lean from your hips.',
        cue: 'The cables should already be tensioned before you begin the fly.'
      },
      {
        number: 2,
        title: 'Arm Position & Elbow Bend',
        instruction: 'Your arms should be elevated and slightly forward, with elbows bent at a fixed 15-20 degrees — this is your "elbow lock" that you maintain for the entire set. A common mistake is changing elbow angle during the rep, turning it into a press rather than a fly. Lock those elbows and keep them locked.',
        cue: 'Soft elbow bend locked in. Never change it mid-rep.'
      },
      {
        number: 3,
        title: 'The Fly Arc (Concentric)',
        instruction: 'Exhale and bring both handles down and together in a wide, sweeping arc, as if you are hugging a massive barrel. Focus on leading with your elbows, not your hands. As the handles meet in front of your lower abdomen, cross your hands slightly (right over left, then alternate sets) for a 1-2 second peak contraction.',
        cue: 'Hug the barrel. Cross at the bottom. Squeeze hard.'
      },
      {
        number: 4,
        title: 'Slow Return (Eccentric)',
        instruction: 'With complete control, allow the cables to pull your arms back up and out over 3 seconds. Resist the pull — the eccentric phase under cable tension is uniquely effective because the cable provides resistance through the ENTIRE range of motion, unlike free weights which become easier at certain points.',
        cue: 'Cable machines never rest. Neither do your muscles. Control the return.'
      },
      {
        number: 5,
        title: 'Breathing & Rep Cadence',
        instruction: 'For cable flys, aim for a higher rep range (12-20 reps) with lighter weight to maximise time-under-tension. This is a finishing movement — your pecs should be full of blood and burning intensely by the last few reps. This signals that you have achieved the pump needed for hypertrophy.',
        cue: 'Feel the burn. Chase the pump. High reps, full range, full squeeze.'
      }
    ]
  },
  {
    id: 'ch-7',
    name: 'Chest Parallel Bar Dips',
    bodyPart: 'Chest',
    level: 'Advanced',
    levelLabel: 'High Level',
    equipment: 'Dip Station / Parallel Bars',
    image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=600&q=80',
    defaultSets: 4,
    defaultReps: 10,
    defaultWeight: 0,
    tip: 'Lean torso forward roughly 30 degrees to transfer load from triceps to chest.',
    youtubeId: '2z8JmcrW-As',
    youtubeUrl: 'https://www.youtube.com/watch?v=2z8JmcrW-As',
    targetMuscle: 'Pectoralis Major (Lower & Sternal Head), Triceps, Anterior Deltoids',
    steps: [
      {
        number: 1,
        title: 'Bar Width & Grip',
        instruction: 'Use dip bars that are slightly wider than shoulder-width if available. Grip the bars firmly, wrists neutral. Mount the station by jumping or stepping up. Lock your arms at the top before beginning the exercise. The wider the bar and the more you lean forward, the more emphasis on chest vs. triceps.',
        cue: 'Wider bars + forward lean = chest emphasis.'
      },
      {
        number: 2,
        title: 'The Critical Forward Lean',
        instruction: 'This is the most important technique cue: lean your torso forward approximately 25-30 degrees from vertical by bringing your chin toward your chest and rounding your upper back very slightly. Cross your ankles behind you and let your legs hang at a slight backward angle. This shifts the line of force from your triceps to your lower and outer chest.',
        cue: 'If you stay upright, you are doing a tricep dip. Lean forward for chest.'
      },
      {
        number: 3,
        title: 'The Descent — Controlled & Deep',
        instruction: 'Inhale deeply and lower yourself slowly over 3 seconds. Keep elbows tracking backward and slightly outward — NOT directly to the side. Descend until your upper arms are at or slightly below parallel to the floor. You will feel a significant stretch in your lower chest and shoulders. Stop before any shoulder discomfort.',
        cue: 'Upper arms parallel to floor = deep enough. Listen to your shoulders.'
      },
      {
        number: 4,
        title: 'The Drive Phase',
        instruction: 'From the bottom, exhale forcefully and push through your palms to drive yourself back up. Maintain your forward lean throughout — do not let your torso pop upright as you press. Stop just before your elbows fully lock to keep tension on the chest.',
        cue: 'Push through your palms. Stay leaned forward all the way to the top.'
      },
      {
        number: 5,
        title: 'Weighted Progression',
        instruction: 'Once you can perform 15+ clean reps with perfect technique, add weight using a dip belt with plates, or hold a dumbbell between your thighs. This is one of the best mass-building movements for the chest — weighted dips are sometimes called "the upper body squat" for a very good reason.',
        cue: 'Master bodyweight first. Then chain the plate. Respect the dip.'
      }
    ]
  },

  // ── BACK ──
  {
    id: 'bk-1',
    name: 'Wide-Grip Lat Pulldown',
    bodyPart: 'Back',
    level: 'Beginner',
    levelLabel: 'Low Level',
    equipment: 'Lat Pulldown Machine',
    image: 'https://images.unsplash.com/photo-1521804906057-1df8fdb718b7?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 45,
    tip: 'Drive your elbows down into your back pockets and avoid excessive leaning.',
    youtubeId: 'CAwf7n6Luuc',
    youtubeUrl: 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
    targetMuscle: 'Latissimus Dorsi, Biceps Brachii, Rear Deltoids',
    steps: [
      {
        number: 1,
        title: 'Machine Setup & Grip',
        instruction: 'Sit at the lat pulldown machine and adjust the thigh pad to lock your legs firmly — this prevents you from lifting off the seat when pulling heavy weight. Reach up and grip the wide bar just outside shoulder-width, using an overhand (pronated) grip. Your arms should be nearly fully extended at the start.',
        cue: 'Thigh pad tight. Grip wide. Arms extended overhead — feel the lat stretch.'
      },
      {
        number: 2,
        title: 'Torso Angle & Bracing',
        instruction: 'Lean back from your hips very slightly — about 10-15 degrees from vertical. This is NOT a momentum lean; it is a fixed angle held throughout the set. Take a deep breath, brace your core, and create a proud chest by lifting your sternum toward the bar before you begin pulling.',
        cue: 'Chest up and forward. Slight lean. Lock that angle in.'
      },
      {
        number: 3,
        title: 'Initiating the Pull — Elbows First',
        instruction: 'The key to activating your lats vs. your biceps: THINK ELBOWS, NOT HANDS. Imagine someone has attached ropes to your elbows and is pulling them down toward your hip pockets. Depress your shoulder blades (pull them DOWN) before you begin the pull. The bar coming down is a consequence of your elbows moving down and back.',
        cue: 'Drive elbows DOWN into your back pockets. Ignore your hands.'
      },
      {
        number: 4,
        title: 'The Full Contraction',
        instruction: 'Pull the bar down to your upper chest / collarbone area. At the bottom, squeeze your lats as hard as you can — hold for 1 second. Your elbows should be pointed directly at the floor and pulled back behind your torso slightly. Your shoulder blades should be fully retracted and depressed.',
        cue: 'Bar to collarbone. Elbows behind you. Squeeze the lats for 1 second.'
      },
      {
        number: 5,
        title: 'Controlled Return & Lat Stretch',
        instruction: 'Slowly allow the bar to travel back up over 3-4 seconds, letting your shoulder blades elevate and your arms extend fully overhead. Feel the stretch in your lats at the top — this stretch under load is equally as important as the contraction for stimulating muscle growth.',
        cue: 'Slow return. Full arm extension. Feel the lat stretch at the top.'
      }
    ]
  },
  {
    id: 'bk-2',
    name: 'Seated Cable Row',
    bodyPart: 'Back',
    level: 'Beginner',
    levelLabel: 'Low Level',
    equipment: 'Low Pulley Cable Row',
    image: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 40,
    tip: 'Keep chest tall, pull handle into upper abdomen, and squeeze lats.',
    youtubeId: 'GZbfZ033f74',
    youtubeUrl: 'https://www.youtube.com/watch?v=GZbfZ033f74',
    targetMuscle: 'Latissimus Dorsi, Rhomboids, Rear Deltoids, Biceps',
    steps: [
      {
        number: 1,
        title: 'Starting Position Setup',
        instruction: 'Sit on the cable row bench with your feet placed against the footrests, knees slightly bent (not locked). Reach forward and grip the cable handle. Your spine should be neutral with a slight forward lean as you extend your arms — this creates the initial stretch in your lats and rhomboids.',
        cue: 'Feet braced, slight knee bend, arms extended, spine neutral.'
      },
      {
        number: 2,
        title: 'The Pull — Elbows Driving Back',
        instruction: 'Exhale and pull the handle toward your upper abdomen by driving your elbows backward along your sides. Your upper body should return to upright (perpendicular to the floor) as you pull. Do NOT lean back aggressively — this turns it into a lower back exercise and removes tension from the lats.',
        cue: 'Torso upright. Handle to upper abdomen. Elbows back and squeezed in.'
      },
      {
        number: 3,
        title: 'Peak Contraction',
        instruction: 'At full row, your torso should be vertical, shoulder blades fully retracted, and your hands near your lower ribcage. Hold for 1 second and squeeze your lats and mid-back as hard as possible. You should feel your back muscles fully engaged from your lower lats up through your rhomboids.',
        cue: 'Squeeze your elbows together behind your back. 1 second hold.'
      },
      {
        number: 4,
        title: 'Controlled Return & Stretch',
        instruction: 'Slowly extend your arms forward over 3 seconds while simultaneously allowing your torso to hinge forward slightly. Let your shoulder blades spread apart at the front — this gives a full lat stretch under tension, which is critical for back development.',
        cue: 'Reach forward. Let shoulder blades spread. Feel the full stretch.'
      },
      {
        number: 5,
        title: 'Common Errors to Avoid',
        instruction: 'The most common error: using excessive torso swing (leaning far back on the pull and far forward on the return). This turns the row into a lower back exercise and increases injury risk. A controlled, minimal torso movement of 10-15 degrees maximum is the hallmark of expert back training technique.',
        cue: 'Back is mostly stationary. Arms and shoulder blades do the work.'
      }
    ]
  },
  {
    id: 'bk-3',
    name: '45° Back Hyperextension',
    bodyPart: 'Back',
    level: 'Beginner',
    levelLabel: 'Low Level',
    equipment: 'Hyperextension Bench',
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 15,
    defaultWeight: 0,
    tip: 'Hinge at the hips and squeeze glutes and spinal erectors at the top.',
    youtubeId: 'ph3pddpKzzw',
    youtubeUrl: 'https://www.youtube.com/watch?v=ph3pddpKzzw',
    targetMuscle: 'Spinal Erectors, Glutes, Hamstrings',
    steps: [
      {
        number: 1, title: 'Equipment Positioning', instruction: 'Adjust the hyperextension bench so the pad rests at the top of your hip bones (iliac crest) — NOT at your waist or stomach. Hook your heels securely under the foot pads. Your body should form a 45-degree angle with the floor when hanging down.',
        cue: 'Pad at hip crests. Heels secured. 45-degree starting angle.'
      },
      {
        number: 2, title: 'Starting Fold & Neutral Spine', instruction: 'Allow your body to hinge forward at the hips until your torso is angled toward the floor. Cross your arms over your chest or place hands at your temples. Maintain a NEUTRAL spine — do not round your lower back. The movement is a hip hinge, not a spinal flex.',
        cue: 'Hinge from the hips. Spine stays neutral — no rounding.'
      },
      {
        number: 3, title: 'The Extension', instruction: 'Exhale and raise your torso by squeezing your glutes and driving your hips into the pad. Lift until your body forms a straight line from head to heels — do NOT hyperextend beyond this point as it compresses the lumbar vertebrae.',
        cue: 'Straight line = stop. Squeezing glutes drives the movement.'
      },
      {
        number: 4, title: 'Peak Hold', instruction: 'At the top, squeeze your glutes and spinal erectors for 1-2 seconds. This isometric hold dramatically increases time-under-tension for the posterior chain muscles.',
        cue: 'Top position hold: squeeze glutes hard for 2 seconds.'
      },
      {
        number: 5, title: 'Progression — Adding Weight', instruction: 'Once 15 bodyweight reps feel easy, hold a weight plate at your chest. Progress slowly — the lower back and spinal erectors are strong muscles but also delicate ones that require gradual overload.',
        cue: 'Bodyweight first. Then a plate at your chest. Progress conservatively.'
      }
    ]
  },
  {
    id: 'bk-4',
    name: 'Barbell Bent-Over Row',
    bodyPart: 'Back',
    level: 'Intermediate',
    levelLabel: 'Mid Level',
    equipment: 'Olympic Barbell & Plates',
    image: 'https://images.unsplash.com/photo-1533681904393-9ab6eee7e408?auto=format&fit=crop&w=600&q=80',
    defaultSets: 4,
    defaultReps: 8,
    defaultWeight: 50,
    tip: 'Maintain flat spine at 45-degree angle; pull bar directly towards navel.',
    youtubeId: 'FWJR5Ve8gkQ',
    youtubeUrl: 'https://www.youtube.com/watch?v=FWJR5Ve8gkQ',
    targetMuscle: 'Latissimus Dorsi, Rhomboids, Trapezius, Rear Deltoids, Biceps',
    steps: [
      {
        number: 1, title: 'Hip Hinge Setup', instruction: 'Stand with feet hip-width apart, barbell over mid-foot. Hinge at the hips (not the waist) until your torso is at 45-60 degrees from the floor. Keep your lower back completely flat — no rounding. Knees slightly bent. This is your rowing position.',
        cue: 'Flat back. Hip hinge. Torso at 45 degrees. Bar hangs at shin level.'
      },
      {
        number: 2, title: 'Grip & Arm Position', instruction: 'Grip the bar just outside shoulder-width with an overhand (pronated) grip. Let the bar hang at arm\'s length below your chest. Your shoulder blades should be protracted (spread) at the start.',
        cue: 'Overhand grip, shoulder-width. Arms hanging — feeling the stretch.'
      },
      {
        number: 3, title: 'The Pull to the Navel', instruction: 'Exhale and pull the bar toward your navel / lower abdomen, NOT your chest. Driving to the lower abdomen forces your elbows to travel at the correct 45-degree angle and maximises lat engagement. Your shoulder blades should fully retract as the bar reaches your body.',
        cue: 'Pull to the navel — not the chest. Elbows at 45 degrees back.'
      },
      {
        number: 4, title: 'Static Torso — No Momentum', instruction: 'The greatest error in the bent-over row is using momentum by bouncing the torso up and down. Your torso angle stays FIXED throughout every rep. Only your arms and shoulder blades should be moving.',
        cue: 'Torso is a statue. Only arms move. No bouncing.'
      },
      {
        number: 5, title: 'Return & Muscle Loading', instruction: 'Lower the bar slowly over 2-3 seconds, feeling your lats stretch. Fully extend your arms and let your shoulder blades protract before initiating the next rep. Full range of motion — from full arm extension to full retraction — every rep.',
        cue: 'Slow descent. Full arm extension. Full scapular protraction. Then pull again.'
      }
    ]
  },
  {
    id: 'bk-5',
    name: 'Supported T-Bar Row',
    bodyPart: 'Back',
    level: 'Intermediate',
    levelLabel: 'Mid Level',
    equipment: 'Chest-Supported T-Bar Machine',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 10,
    defaultWeight: 35,
    tip: 'Zero lower back strain: pull smoothly through elbows and hold peak for 1 second.',
    youtubeId: 'j3Igk5nyZE4',
    youtubeUrl: 'https://www.youtube.com/watch?v=j3Igk5nyZE4',
    targetMuscle: 'Latissimus Dorsi, Rhomboids, Trapezius (Mid)',
    steps: [
      {
        number: 1, title: 'Chest Support Pad Setup', instruction: 'Set the chest pad so it supports your sternum comfortably. Straddle the machine, gripping the handles with both hands. The chest support eliminates lower back stress, making this ideal for athletes with back issues or those who want to isolate the back without spinal fatigue.',
        cue: 'Chest on the pad. Back is supported. Pure lat and rhomboid work.'
      },
      {
        number: 2, title: 'Grip Options', instruction: 'Most T-Bar machines offer multiple grip positions — neutral (palms facing each other), wide overhand, or close supinated. Neutral grip allows the greatest range of motion and natural elbow path for most people, making it the recommended starting choice.',
        cue: 'Neutral grip = most natural, most range of motion for most people.'
      },
      {
        number: 3, title: 'The Pull', instruction: 'Drive elbows up and back, squeezing shoulder blades together. Pull until handles reach chest level. Hold 1 second at the peak.',
        cue: 'Elbows high and back. Peak hold. Feel the mid-back burn.'
      },
      {
        number: 4, title: 'Controlled Descent', instruction: 'Lower weight over 3 seconds to full arm extension. Feel the stretch in lats and rhomboids.',
        cue: '3-second descent. Full extension. Full stretch. Then pull.'
      },
      {
        number: 5, title: 'Volume & Intensity', instruction: 'This is an excellent volume exercise. Use moderate weight for 3-4 sets of 10-15 reps to drive blood into the back muscles.',
        cue: 'Moderate weight, high reps, maximum mind-muscle connection.'
      }
    ]
  },
  {
    id: 'bk-6',
    name: 'Conventional Barbell Deadlift',
    bodyPart: 'Back',
    level: 'Advanced',
    levelLabel: 'High Level',
    equipment: 'Olympic Barbell & Bumper Plates',
    image: 'https://images.unsplash.com/photo-1530822847156-5df684ec5105?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 5,
    defaultWeight: 90,
    tip: 'Brace core, engage lats, push the floor away while maintaining neutral spine.',
    youtubeId: 'op9kVnSso6Q',
    youtubeUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q',
    targetMuscle: 'Spinal Erectors, Glutes, Hamstrings, Traps, Lats, Entire Posterior Chain',
    steps: [
      {
        number: 1, title: 'Bar Position & Stance', instruction: 'Stand with the bar directly over the middle of your feet. Feet hip-width apart, toes slightly out. Shins should be about 2-3cm from the bar. DO NOT touch the bar yet.',
        cue: 'Bar over mid-foot. Feet hip-width. Shins 2-3cm from bar.'
      },
      {
        number: 2, title: 'Hip Hinge to Bar', instruction: 'Hinge at the hips and bend your knees until you can grip the bar just outside your legs. Your back should be flat, hips above knees, and shoulders directly over or slightly in front of the bar.',
        cue: 'Hips above knees. Shoulders over bar. Flat back. Now grip.'
      },
      {
        number: 3, title: 'Lat Engagement ("Protect Your Armpits")', instruction: 'Before lifting: take a massive breath, brace your core like a suit of armour, and "protect your armpits" — this cue activates your lats and creates a rigid torso. This is the most critical safety step in the deadlift.',
        cue: 'Big breath. Core brace. Lats tight. "Protect your armpits."'
      },
      {
        number: 4, title: 'The Lift — Push Floor Away', instruction: 'Think "push the floor away" rather than "pull the bar up." Drive through your heels as you extend your knees and hips simultaneously. The bar travels straight up, staying in contact with your legs the entire way. At lockout, hips forward, glutes squeezed, standing tall.',
        cue: 'Push floor away. Bar drags up your shins/thighs. Hips lock at top.'
      },
      {
        number: 5, title: 'The Return', instruction: 'Hinge at the hips first (NOT the lower back), then bend the knees as the bar passes your knees. Lower with the same control you lifted with. For training sets, lower controlled. For max effort, you can drop the bar from lockout onto bumper plates.',
        cue: 'Hips back first on the descent. Same path down as up.'
      }
    ]
  },

  // ── SHOULDERS ──
  {
    id: 'sh-1',
    name: 'Seated Shoulder Press Machine',
    bodyPart: 'Shoulders',
    level: 'Beginner',
    levelLabel: 'Low Level',
    equipment: 'Overhead Press Machine',
    image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 30,
    tip: 'Safe fixed trajectory ideal for building anterior deltoid strength.',
    youtubeId: 'WvLMauqrnK8',
    youtubeUrl: 'https://www.youtube.com/watch?v=WvLMauqrnK8',
    targetMuscle: 'Anterior & Lateral Deltoids, Triceps, Upper Trapezius',
    steps: [
      { number: 1, title: 'Seat Adjustment', instruction: 'Set seat so handles align with the top of your shoulders. Sit tall, back pressed against pad, feet flat on floor.', cue: 'Handles at shoulder height. Back flat on pad.' },
      { number: 2, title: 'Grip & Wrist Position', instruction: 'Grip handles firmly, wrists straight and neutral. Avoid bending wrists back — keep them stacked directly above your elbows.', cue: 'Straight wrists. Full grip. Elbows under wrists.' },
      { number: 3, title: 'The Press', instruction: 'Exhale and press handles overhead without fully locking elbows. Keep movement controlled and smooth through the machine\'s arc.', cue: 'Press up. Stop just before lockout. Smooth arc.' },
      { number: 4, title: 'Controlled Descent', instruction: 'Lower handles slowly over 2-3 seconds until elbows are just below shoulder height. Feel the anterior deltoid stretch.', cue: '3 seconds down. Elbows below shoulder height at bottom.' },
      { number: 5, title: 'Tempo & Volume', instruction: 'Machine pressing is ideal for building volume safely. Aim for 3-4 sets of 10-15 reps. The fixed path reduces stabiliser demand, allowing you to focus entirely on the deltoid contraction.', cue: 'Feel the deltoid, not the tricep. Focus on shoulder activation.' }
    ]
  },
  {
    id: 'sh-2',
    name: 'Dumbbell Lateral Raise',
    bodyPart: 'Shoulders',
    level: 'Beginner',
    levelLabel: 'Low Level',
    equipment: 'Dumbbells',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80',
    defaultSets: 4,
    defaultReps: 15,
    defaultWeight: 8,
    tip: 'Lead with elbows slightly forward in the scapular plane for round delts.',
    youtubeId: '3VcKaXpzqRo',
    youtubeUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
    targetMuscle: 'Lateral (Medial) Deltoids',
    steps: [
      { number: 1, title: 'Starting Position', instruction: 'Stand or sit with dumbbells by your sides, palms facing your hips. Slight bend in elbows, core braced, chest up.', cue: 'Dumbbells at sides. Slight elbow bend locked in.' },
      { number: 2, title: 'The Scapular Plane', instruction: 'Raise arms slightly FORWARD (about 15-30 degrees in front of your body). This is the scapular plane, where the shoulder joint is safest and the lateral delt is most active.', cue: 'Raise slightly forward. NOT directly to the side.' },
      { number: 3, title: 'The Raise', instruction: 'Lead with your elbows — imagine pouring a jug of water with each hand. Raise until arms are parallel to the floor (shoulder height). Go no higher — above parallel, your trapezius takes over.', cue: 'Lead with elbows. Stop at shoulder height. Pour the jug.' },
      { number: 4, title: 'Controlled Descent', instruction: 'Lower the dumbbells slowly over 3-4 seconds. This eccentric phase is where lateral delt growth happens. Fight gravity on the way down.', cue: '4 seconds down. Fight gravity. Do not let weights drop.' },
      { number: 5, title: 'Partial Reps & Burns', instruction: 'On the final set, after full reps to failure, perform 10-15 short partial reps in the bottom half of the range. This technique burns out any remaining muscle fibres and creates incredible hypertrophic stimulus.', cue: 'Full reps to failure, then partial reps. Total burnout.' }
    ]
  },
  {
    id: 'sh-3',
    name: 'Cable Face Pull with Rope',
    bodyPart: 'Shoulders',
    level: 'Beginner',
    levelLabel: 'Low Level',
    equipment: 'Cable Tower & Rope',
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 15,
    defaultWeight: 20,
    tip: 'Essential shoulder health movement: pull rope towards forehead and rotate thumbs back.',
    youtubeId: 'rep-qVOkqgk',
    youtubeUrl: 'https://www.youtube.com/watch?v=rep-qVOkqgk',
    targetMuscle: 'Posterior Deltoids, External Rotators, Trapezius (Mid), Rhomboids',
    steps: [
      { number: 1, title: 'Cable Height', instruction: 'Set the cable pulley to face/forehead height. Attach the rope. Step back until there is tension in the cable.', cue: 'Pulley at face height. Step back. Cable already tensioned.' },
      { number: 2, title: 'Grip & Starting Position', instruction: 'Grip each end of the rope with your palms facing inward. Arms extended toward the pulley. Core braced, slight stagger in your feet for balance.', cue: 'Overhand grip on rope ends. Arms extended. Stable stance.' },
      { number: 3, title: 'The Pull to Forehead', instruction: 'Pull the rope toward your forehead, keeping your elbows HIGH and flared out wide (above shoulder height). As rope reaches your face, externally rotate your upper arms — thumbs should end up pointing BEHIND you.', cue: 'High elbows. Rope to forehead. Thumbs point behind you.' },
      { number: 4, title: 'Why This Matters', instruction: 'The external rotation at peak is what makes this exercise extraordinary for shoulder health. It trains the infraspinatus and teres minor — the most neglected muscles in most training programs — essential for rotator cuff health.', cue: 'The thumb rotation is the whole point. Do not skip it.' },
      { number: 5, title: 'Slow Return', instruction: 'Resist the cable on the return over 2-3 seconds, maintaining controlled elbow path. Never allow the cable to yank your arms forward.', cue: 'Resist the return. 3 seconds. Control the cable, it does not control you.' }
    ]
  },
  {
    id: 'sh-4',
    name: 'Reverse Pec Deck (Rear Delts)',
    bodyPart: 'Shoulders',
    level: 'Beginner',
    levelLabel: 'Low Level',
    equipment: 'Reverse Fly Machine',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 25,
    tip: 'Keep handles at shoulder level and isolate the posterior deltoid.',
    youtubeId: '6kALZikXxLc',
    youtubeUrl: 'https://www.youtube.com/watch?v=6kALZikXxLc',
    targetMuscle: 'Posterior Deltoids, Rhomboids, Trapezius (Mid)',
    steps: [
      { number: 1, title: 'Machine Setup', instruction: 'Reverse the seat orientation so you face the back pad. Set handles to shoulder height. Grip handles with arms extended forward.', cue: 'Face the pad. Handles at shoulder height. Arms extended forward.' },
      { number: 2, title: 'Chest to Pad', instruction: 'Press your chest gently against the back pad to prevent torso rotation and isolate the rear delts. Keep your head neutral.', cue: 'Chest on pad. Head neutral. Torso locked in place.' },
      { number: 3, title: 'The Fly', instruction: 'Exhale and sweep arms wide apart in a horizontal arc, squeezing shoulder blades together at the back. Stop when arms are in line with your torso.', cue: 'Arms wide. Shoulder blades squeeze together at peak.' },
      { number: 4, title: 'Return with Resistance', instruction: 'Slowly return arms forward over 3 seconds, resisting the machine.', cue: '3 second return. Feel the rear delt working both ways.' },
      { number: 5, title: 'High Volume Protocol', instruction: 'Rear delts are a smaller muscle group that responds well to higher rep ranges (15-25). Use lighter weight with perfect form rather than heavier weight with partial range.', cue: 'Light weight. Full arc. 15-25 reps per set.' }
    ]
  },
  {
    id: 'sh-5',
    name: 'Standing Barbell Overhead Press (OHP)',
    bodyPart: 'Shoulders',
    level: 'Intermediate',
    levelLabel: 'Mid Level',
    equipment: 'Olympic Barbell & Rack',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
    defaultSets: 4,
    defaultReps: 6,
    defaultWeight: 40,
    tip: 'Squeeze glutes and abs to avoid hyperextending your lumbar spine.',
    youtubeId: '2yjwXTZQDDI',
    youtubeUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI',
    targetMuscle: 'Anterior & Lateral Deltoids, Triceps, Core, Upper Trapezius',
    steps: [
      { number: 1, title: 'Rack Setup & Grip', instruction: 'Set the rack so the bar is at upper-chest height. Grip just outside shoulder-width. Forearms should be vertical when gripping.', cue: 'Bar at chest height in rack. Vertical forearms on grip.' },
      { number: 2, title: 'Full-Body Brace', instruction: 'Squeeze your glutes HARD, brace your core like a suit of armour, and keep your ribs DOWN. This prevents the dangerous lower-back arch that causes lumbar injury during overhead pressing.', cue: 'Squeeze glutes. Brace abs. Ribs DOWN. This protects your lower back.' },
      { number: 3, title: 'Head Movement & Bar Path', instruction: 'As you press the bar overhead, move your head slightly back to give the bar a straight vertical path past your face, then move head back forward as bar passes. Bar travels in a straight vertical line — not in an arc.', cue: 'Head back slightly as bar passes. Straight vertical bar path.' },
      { number: 4, title: 'Lockout', instruction: 'Press fully to lockout, stacking your wrists, elbows, and shoulders in a vertical line. Shrug slightly at the top for the final inch of tricep and deltoid engagement.', cue: 'Full lockout. Shrug at the top. Vertical stack.' },
      { number: 5, title: 'Controlled Descent', instruction: 'Lower the bar to your upper chest/clavicle over 2-3 seconds. Touch your clavicle/upper chest and immediately press again. Keep the full-body brace throughout every rep.', cue: 'Lower to clavicle. Stay braced. Never relax at the bottom.' }
    ]
  },

  // ── LEGS ──
  {
    id: 'lg-1',
    name: '45-Degree Incline Leg Press',
    bodyPart: 'Legs',
    level: 'Beginner',
    levelLabel: 'Low Level',
    equipment: '45° Leg Press Machine',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 100,
    tip: 'Lower weight until knees are at 90 degrees; do NOT lock knees at the top.',
    youtubeId: 'IZxyjW7MPJQ',
    youtubeUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ',
    targetMuscle: 'Quadriceps, Glutes, Hamstrings (secondary)',
    steps: [
      { number: 1, title: 'Foot Placement', instruction: 'Place feet shoulder-width apart on the platform, toes pointing slightly outward. Mid-platform — not too high (glute dominant) and not too low (knee strain).', cue: 'Shoulder-width. Mid-platform. Toes slightly out.' },
      { number: 2, title: 'Back & Glute Position', instruction: 'Keep your lower back and glutes pressed firmly against the seat pad at all times. A common error is the lower back lifting off the seat at the bottom of the movement — this is dangerous for your spine.', cue: 'Back and glutes NEVER leave the pad. Ever.' },
      { number: 3, title: 'The Descent', instruction: 'Release the safety bars and lower the platform slowly over 3 seconds until knees reach 90 degrees (or slightly below if flexibility allows). Do not bounce at the bottom.', cue: 'Knees to 90 degrees. 3 seconds down. No bounce.' },
      { number: 4, title: 'The Press', instruction: 'Drive through the entire foot (not just toes or heels) to press the platform back up. Stop JUST before your knees fully lock — this keeps tension on the quads and protects the knee joint from hyperextension.', cue: 'Full foot press. Stop before lockout. Quads stay tensioned.' },
      { number: 5, title: 'Safety Re-rack', instruction: 'Always re-engage the safety bars before stepping off the machine. Never walk away with the safety bars disengaged.', cue: 'Safety bars FIRST before exiting. Non-negotiable.' }
    ]
  },
  {
    id: 'lg-2',
    name: 'Seated Leg Extension Machine',
    bodyPart: 'Legs',
    level: 'Beginner',
    levelLabel: 'Low Level',
    equipment: 'Leg Extension Machine',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 15,
    defaultWeight: 40,
    tip: 'Isolates the quadriceps: pause for 1 second at top extension.',
    youtubeId: 'YyvSfVjQeL0',
    youtubeUrl: 'https://www.youtube.com/watch?v=YyvSfVjQeL0',
    targetMuscle: 'Quadriceps (all four heads)',
    steps: [
      { number: 1, title: 'Machine Setup', instruction: 'Adjust the seat back so knees align with the machine\'s pivot point. Place feet under the roller pad just above your ankles.', cue: 'Knees at pivot. Feet under pad. Correct alignment is critical.' },
      { number: 2, title: 'Extension', instruction: 'Exhale and extend your knees to near lockout. At the top, flex your quads as hard as possible for 1-2 seconds.', cue: 'Full extension. Flex hard at the top. Hold 1-2 seconds.' },
      { number: 3, title: 'Slow Return', instruction: 'Lower over 3-4 seconds — the slow eccentric phase under load creates significant quad hypertrophy stimulus.', cue: '4 seconds down. Quads fighting gravity the whole way.' },
      { number: 4, title: 'Foot Position', instruction: 'Toes pointing slightly inward targets the vastus lateralis (outer quad sweep). Toes slightly outward targets the VMO (inner quad teardrop). Neutral toes = balanced quad development.', cue: 'Toes in = outer quad. Toes out = inner quad. Neutral = balanced.' },
      { number: 5, title: 'Note on Knee Health', instruction: 'Leg extensions have gotten a bad reputation, but when performed with proper weight and full range, they are safe and highly effective for quad isolation. Avoid using excessive weight that forces you to shorten the range of motion.', cue: 'Light enough for full range. Safety is priority.' }
    ]
  },
  {
    id: 'lg-3',
    name: 'Lying Hamstring Leg Curl',
    bodyPart: 'Legs',
    level: 'Beginner',
    levelLabel: 'Low Level',
    equipment: 'Prone Leg Curl Machine',
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 35,
    tip: 'Keep hips pinned to pad to prevent lower back compensation.',
    youtubeId: '1Tq3QdYUuHs',
    youtubeUrl: 'https://www.youtube.com/watch?v=1Tq3QdYUuHs',
    targetMuscle: 'Hamstrings (Biceps Femoris, Semitendinosus, Semimembranosus)',
    steps: [
      { number: 1, title: 'Position & Alignment', instruction: 'Lie face down on the machine. Position the roller pad just above your heels (above the Achilles tendon). Your knees should be just off the edge of the bench pad.', cue: 'Roller above Achilles. Knees just off the bench edge.' },
      { number: 2, title: 'Hip Pin', instruction: 'Press your hips FIRMLY into the pad throughout every rep. Allowing your hips to rise is a compensation pattern that puts the work into your lower back instead of your hamstrings.', cue: 'Hips GLUED to the pad. No rising. Hamstrings do ALL the work.' },
      { number: 3, title: 'The Curl', instruction: 'Exhale and curl your heels toward your glutes as far as possible. At the peak, squeeze your hamstrings with maximum intensity for 1 second.', cue: 'Heels to glutes. Squeeze hard at peak. Full range of motion.' },
      { number: 4, title: 'Plantarflexion Tip', instruction: 'Pointing your toes (plantarflexion) during the curl puts the hamstrings in a slightly shorter position and reduces bicep femoris activation. Flex your feet (dorsiflexion) for maximum hamstring tension.', cue: 'Flex your feet (pull toes toward shins) for maximum hamstring stretch.' },
      { number: 5, title: 'Eccentric Control', instruction: 'Lower the weight over 3-4 seconds. The hamstrings are particularly prone to injury from fast, uncontrolled descents. Control the eccentric and you will dramatically reduce your risk of hamstring strains.', cue: 'Slow down. 4 seconds. Protect your hamstrings.' }
    ]
  },
  {
    id: 'lg-4',
    name: 'Dumbbell Goblet Squat',
    bodyPart: 'Legs',
    level: 'Beginner',
    levelLabel: 'Low Level',
    equipment: 'Heavy Dumbbell / Kettlebell',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 10,
    defaultWeight: 16,
    tip: 'Hold dumbbell vertically at chest; descend between knees keeping chest up.',
    youtubeId: 'MeIiIdhvXT4',
    youtubeUrl: 'https://www.youtube.com/watch?v=MeIiIdhvXT4',
    targetMuscle: 'Quadriceps, Glutes, Inner Thighs, Core, Upper Back',
    steps: [
      { number: 1, title: 'Goblet Hold', instruction: 'Hold one dumbbell vertically by the top (like holding a goblet) at your sternum. Elbows should be pointing down. Feet slightly wider than shoulder-width, toes out 15-30 degrees.', cue: 'Dumbbell at sternum. Elbows down. Feet wider than hips, toes out.' },
      { number: 2, title: 'The Descent', instruction: 'Sit DOWN between your knees, not forward over your toes. Think of sitting onto a chair directly behind you while keeping your chest tall. The dumbbell acts as a counterbalance allowing you to go deeply upright.', cue: 'Sit DOWN, not forward. Chest tall. Between the knees.' },
      { number: 3, title: 'Depth', instruction: 'Descend until your elbows touch the inside of your knees (ideally) or until your hips are below your knees. This full range of motion activates the full quad length and maximises glute activation.', cue: 'Elbows touch inside of knees. Below parallel = ideal.' },
      { number: 4, title: 'The Drive', instruction: 'Drive through your heels and mid-foot, pushing the floor away. Keep your chest tall and drive your knees outward (in line with your toes) throughout the ascent.', cue: 'Drive through heels. Chest tall. Knees pushed out over toes.' },
      { number: 5, title: 'The Goblet Advantage', instruction: 'The goblet squat naturally teaches perfect squat mechanics. The dumbbell weight pulls you forward, forcing your upper back and core to work hard to stay upright. This makes it one of the best teaching tools for the squat pattern.', cue: 'The dumbbell teaches you good form. Let it guide you.' }
    ]
  },
  {
    id: 'lg-5',
    name: 'Standing Calf Raise Machine',
    bodyPart: 'Legs',
    level: 'Beginner',
    levelLabel: 'Low Level',
    equipment: 'Calf Raise Machine',
    image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=600&q=80',
    defaultSets: 4,
    defaultReps: 15,
    defaultWeight: 50,
    tip: 'Deep stretch at the bottom and full 2-second contraction on balls of feet.',
    youtubeId: 'YMmgqO8Jo-k',
    youtubeUrl: 'https://www.youtube.com/watch?v=YMmgqO8Jo-k',
    targetMuscle: 'Gastrocnemius (primary), Soleus (secondary)',
    steps: [
      { number: 1, title: 'Foot Platform Position', instruction: 'Place the balls of your feet on the edge of the platform. Heels hanging freely below. Feet hip-width apart, toes pointing forward or very slightly out.', cue: 'Balls of feet on edge. Heels hanging. Full range incoming.' },
      { number: 2, title: 'The Stretch', instruction: 'Lower your heels as far as possible toward the floor for a deep gastrocnemius stretch. Hold this stretched position for 1-2 seconds. This full stretch is what separates serious calf training from casual calf training.', cue: 'Heels as low as they go. 2-second stretch hold. Non-negotiable.' },
      { number: 3, title: 'The Rise', instruction: 'Drive up onto the tips of your toes as high as possible. At the peak, hold the contraction for 2 full seconds. Squeeze your calves as hard as you can — they are notoriously stubborn muscles that need extra stimulation.', cue: 'As high as possible. 2-second peak squeeze. Maximum height.' },
      { number: 4, title: 'Rep Tempo', instruction: 'Optimal calf raise tempo: 2 seconds up, 2 seconds hold at peak, 3 seconds down, 2 seconds hold at stretch. This is much slower than most people train calves, and it is exactly why calves are underdeveloped for most people.', cue: 'Tempo: 2 up, 2 hold top, 3 down, 2 hold bottom = growth.' },
      { number: 5, title: 'Volume for Calves', instruction: 'Calves are among the most trained muscles in the body (every step is calf activation). They require high volume and high frequency to grow. 4-6 sets, 15-20 reps, 3-5 days per week is optimal.', cue: 'High volume. High frequency. Calves are stubborn — train them hard.' }
    ]
  },
  {
    id: 'lg-6',
    name: 'Barbell Olympic Back Squat',
    bodyPart: 'Legs',
    level: 'Intermediate',
    levelLabel: 'Mid Level',
    equipment: 'Power Squat Rack & Barbell',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
    defaultSets: 4,
    defaultReps: 8,
    defaultWeight: 75,
    tip: 'King of leg builders: descend below parallel, drive up through midfoot.',
    youtubeId: 'bEv6CCg2BC8',
    youtubeUrl: 'https://www.youtube.com/watch?v=bEv6CCg2BC8',
    targetMuscle: 'Quadriceps, Glutes, Hamstrings, Spinal Erectors, Core',
    steps: [
      { number: 1, title: 'Bar Placement (High vs Low Bar)', instruction: 'High bar: bar rests on the upper traps (more upright torso, quad dominant). Low bar: bar rests on the posterior deltoids (more forward lean, glute/hip dominant). Both are valid. Choose based on your goals. Most beginners start high bar.', cue: 'High bar = quad dominant. Low bar = hip/glute dominant.' },
      { number: 2, title: 'Brace & Unrack', instruction: 'Take a massive breath into your belly (valsalva maneuver), brace your entire core like concrete, unrack the bar by standing up, and take 2-3 steps back. Set your feet — shoulder to hip-width apart, toes out 15-30 degrees.', cue: 'Maximum core brace before unracking. 2-3 steps back only.' },
      { number: 3, title: 'The Descent — Box Sit', instruction: 'Initiate by breaking at the hips AND knees simultaneously. Push knees outward in the direction of your toes throughout the descent. Sit to BELOW parallel — hip crease below the top of the kneecap. No quarter reps.', cue: 'Break hips and knees simultaneously. Below parallel. Every. Rep.' },
      { number: 4, title: 'The Drive', instruction: 'From the bottom, drive through your entire foot. Think "spread the floor apart" with your feet as you rise. Keep your chest up — do not let it collapse forward. Maintain the outward knee drive throughout the ascent.', cue: 'Spread the floor. Chest up. Knees out. Drive to lockout.' },
      { number: 5, title: 'Re-racking Safely', instruction: 'After your last rep, walk forward to the rack (do not step backward to it). Make sure both sides of the bar contact the uprights simultaneously before releasing.', cue: 'Walk FORWARD to rack. Both sides contact simultaneously.' }
    ]
  },
  {
    id: 'lg-7',
    name: 'Bulgarian Split Squat',
    bodyPart: 'Legs',
    level: 'Advanced',
    levelLabel: 'High Level',
    equipment: 'Flat Bench & Dumbbells',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 10,
    defaultWeight: 14,
    tip: 'Rear foot elevated on bench; descend straight down for brutal unilateral quad growth.',
    youtubeId: '2C-uNgKwPLE',
    youtubeUrl: 'https://www.youtube.com/watch?v=2C-uNgKwPLE',
    targetMuscle: 'Quadriceps, Glutes, Hip Flexors, Core (Unilateral)',
    steps: [
      { number: 1, title: 'Bench Distance', instruction: 'Stand about 2-3 feet in front of a bench. Reach one foot back and place it (toes down or top of foot flat) on the bench. Your front foot should be far enough forward that your shin stays roughly vertical at the bottom.', cue: 'Front shin vertical at bottom = correct front foot distance.' },
      { number: 2, title: 'The Descent', instruction: 'Lower yourself STRAIGHT DOWN — like a normal squat, not forward. Your front knee tracks over your toes. Descend until your back knee hovers just above the floor.', cue: 'Straight down. Not forward. Back knee just above floor.' },
      { number: 3, title: 'Torso Position', instruction: 'Keep your torso upright or with very slight forward lean. This is what makes BSS so brutal on the quad — the upright torso forces the front quad to do massive work.', cue: 'Upright torso = quad torture. That is the goal.' },
      { number: 4, title: 'The Drive', instruction: 'Drive through your front heel to press yourself back to the starting position. Your rear leg is a balance aid only — do not push through it.', cue: 'Drive through front heel ONLY. Rear leg = balance, not power.' },
      { number: 5, title: 'Complete Both Sides', instruction: 'Perform all reps on one leg before switching. The unilateral nature exposes and corrects strength imbalances between legs — a critical benefit for overall athletic performance.', cue: 'Finish all reps on one leg. Then switch. Feel the difference.' }
    ]
  },

  // ── ARMS ──
  {
    id: 'ar-1',
    name: 'Preacher Curl Machine',
    bodyPart: 'Arms',
    level: 'Beginner',
    levelLabel: 'Low Level',
    equipment: 'Preacher Curl Machine',
    image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 25,
    tip: 'Isolates the bicep brachii by immobilizing upper arm against padded angle.',
    youtubeId: 'fIWP-FRFNU0',
    youtubeUrl: 'https://www.youtube.com/watch?v=fIWP-FRFNU0',
    targetMuscle: 'Biceps Brachii (Long & Short Head)',
    steps: [
      { number: 1, title: 'Pad Setup', instruction: 'Adjust the seat so the top of the preacher pad aligns with your armpit/shoulder when seated. Your upper arms should rest flat on the angled pad throughout the movement.', cue: 'Top of pad at armpit height. Upper arms flat on pad.' },
      { number: 2, title: 'The Curl', instruction: 'Curl the handles toward your face with full supination (palms rotating outward and up). The machine eliminates cheating — you cannot use momentum or body swing here.', cue: 'Curl to face. Supinate the wrists. Pure bicep isolation.' },
      { number: 3, title: 'Peak Contraction', instruction: 'At the top, squeeze your biceps for 1-2 seconds. Feel the muscle fully contracted. The preacher position gives an incredible peak squeeze.', cue: 'Squeeze at the top for 2 seconds. Maximum contraction.' },
      { number: 4, title: 'Slow Eccentric', instruction: 'Lower over 3-4 seconds. Resist all the way to near full extension (but keep a tiny bend to protect elbow tendons).', cue: '4 seconds down. Near full extension. Protect elbows.' },
      { number: 5, title: 'Targeted Muscle Feeling', instruction: 'If you do not feel it in your biceps, the weight is too heavy. Lower the weight until you feel a burning squeeze in the bicep with each rep.', cue: 'If you feel it in your shoulders or back — weight is too heavy.' }
    ]
  },
  {
    id: 'ar-2',
    name: 'Standing Dumbbell Bicep Curls',
    bodyPart: 'Arms',
    level: 'Beginner',
    levelLabel: 'Low Level',
    equipment: 'Dumbbell Set',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 12,
    tip: 'Supinate wrists as you curl up for complete peak contraction.',
    youtubeId: 'ykJmrZ5v0Oo',
    youtubeUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
    targetMuscle: 'Biceps Brachii, Brachialis, Brachioradialis',
    steps: [
      { number: 1, title: 'Starting Position', instruction: 'Stand with feet shoulder-width, core braced, dumbbells hanging by your sides, palms facing your hips. Elbows close to your torso. Shoulders packed down, not shrugged.', cue: 'Tall spine. Elbows at sides. Palms neutral at start.' },
      { number: 2, title: 'The Curl & Supination', instruction: 'As you curl the dumbbells up, ROTATE your palms outward so they face fully upward by mid-movement. This supination twist fully engages the short head of the bicep and is what separates dumbbell curls from barbell curls.', cue: 'Rotate palms as you curl. Neutral to supinated = full bicep activation.' },
      { number: 3, title: 'Elbow Position', instruction: 'Keep elbows strictly at your sides throughout. A common error is allowing elbows to drift forward (essentially turning the top half into a front raise with momentum). Fixed elbows = all bicep, no cheat.', cue: 'Elbows stay at your sides. They are nailed there. Non-negotiable.' },
      { number: 4, title: 'Alternating vs Simultaneous', instruction: 'Alternating curls (one arm at a time) allows full concentration on each bicep and slightly greater range of motion. Simultaneous curls build more overall fatigue. Alternate sets for variety.', cue: 'Alternate for focus. Simultaneous for fatigue. Both are valid.' },
      { number: 5, title: 'No Body Swing', instruction: 'If you are rocking your body to lift the weight, it is too heavy. The only part of your body that should be moving is your forearm rotating upward from the elbow. Everything else is stationary.', cue: 'Zero body movement. Only forearms move. Check your ego at the door.' }
    ]
  },
  {
    id: 'ar-3',
    name: 'Cable Tricep Pushdown (Rope/Bar)',
    bodyPart: 'Arms',
    level: 'Beginner',
    levelLabel: 'Low Level',
    equipment: 'Cable Tower & Rope',
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 15,
    defaultWeight: 25,
    tip: 'Keep elbows glued to sides; flare rope outwards at bottom lock.',
    youtubeId: '2-LAMcpzODU',
    youtubeUrl: 'https://www.youtube.com/watch?v=2-LAMcpzODU',
    targetMuscle: 'Triceps Brachii (Long, Lateral & Medial Heads)',
    steps: [
      { number: 1, title: 'Cable & Attachment Setup', instruction: 'Set the cable pulley to the top position. Attach a rope (for maximum range) or a straight/V-bar. Stand facing the machine, about one foot back, with a slight forward lean from the hips.', cue: 'Top pulley. Rope attachment for best range. Slight forward lean.' },
      { number: 2, title: 'Elbow Lock', instruction: 'The single most important technique cue: elbows are glued to your sides at a fixed position throughout the ENTIRE set. They should NOT move forward, backward, or flare out. The only movement is in your forearms rotating downward.', cue: 'Elbows are nails in your sides. Only forearms move.' },
      { number: 3, title: 'The Pushdown', instruction: 'Exhale and push the rope/bar down until your arms are fully extended. At the bottom, if using a rope, split the ends apart (flare outward) to maximise the lateral head contraction.', cue: 'Full extension. Rope: flare ends outward at bottom for peak squeeze.' },
      { number: 4, title: 'Return Control', instruction: 'Resist the cable on the return, allowing forearms to rise until elbows are at roughly 90 degrees or slightly above. Going higher than this causes elbows to drift forward, changing the exercise mechanics.', cue: 'Return to 90 degrees. Elbows stay back. Do not go higher.' },
      { number: 5, title: 'Mind-Muscle Connection', instruction: 'Consciously squeeze the back of your upper arm (tricep) at the bottom of every rep. A slow, deliberate pushdown with a 1-2 second lockout will be far more effective than fast, sloppy reps with heavy weight.', cue: 'Slow and squeeze. Feel the horseshoe on the back of your arm.' }
    ]
  },
  {
    id: 'ar-4',
    name: 'Lying EZ-Bar Skull Crushers',
    bodyPart: 'Arms',
    level: 'Intermediate',
    levelLabel: 'Mid Level',
    equipment: 'EZ-Curl Bar & Flat Bench',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 10,
    defaultWeight: 25,
    tip: 'Lower bar towards forehead/crown, elbows pointing straight at ceiling.',
    youtubeId: 'd_KZxkY_0cM',
    youtubeUrl: 'https://www.youtube.com/watch?v=d_KZxkY_0cM',
    targetMuscle: 'Triceps Brachii (Long Head — mass builder)',
    steps: [
      { number: 1, title: 'Setup & Grip', instruction: 'Lie on a flat bench holding an EZ-bar with an overhand grip on the inner angled grips. Arms extended directly over your chest. Feet flat on the floor.', cue: 'Arms extended over chest. Inner grips. Feet flat.' },
      { number: 2, title: 'Elbow Position', instruction: 'Point your elbows directly at the ceiling — they should NOT flare outward during the movement. Flared elbows put excessive stress on the elbow joint and shift the work away from the long head of the tricep.', cue: 'Elbows pointing at the ceiling. Never flare outward.' },
      { number: 3, title: 'The Lowering', instruction: 'Bend elbows ONLY — your upper arms stay vertical. Lower the bar toward your forehead or the top of your head (hence "skull crusher") over 3 seconds. The bar should land just above your hairline at the bottom.', cue: 'Upper arms = vertical statues. Only forearms lower. Bar toward forehead.' },
      { number: 4, title: 'The Extension', instruction: 'Exhale and extend your elbows to press the bar back to the starting position. Do not fully lock your elbows — keep a micro-bend to maintain tension and protect the elbow joint.', cue: 'Extend to near lockout. Micro-bend preserved. Long head fully contracted.' },
      { number: 5, title: 'Tricep Stretching for Growth', instruction: 'The skull crusher is uniquely effective because it trains the long head of the tricep in a stretched position — this is where the greatest growth stimulus occurs. Do not short-range this exercise. Go deep.',
        cue: 'Deep range = long head stretch = more tricep mass. Go all the way down.' }
    ]
  },

  // ── CORE ──
  {
    id: 'co-1',
    name: 'Seated Abdominal Crunch Machine',
    bodyPart: 'Core',
    level: 'Beginner',
    levelLabel: 'Low Level',
    equipment: 'Abdominal Machine',
    image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 15,
    defaultWeight: 30,
    tip: 'Flex spine forward using abs rather than pulling with arms or hip flexors.',
    youtubeId: 'k_l55dJ_o-I',
    youtubeUrl: 'https://www.youtube.com/watch?v=k_l55dJ_o-I',
    targetMuscle: 'Rectus Abdominis (Abdominals)',
    steps: [
      { number: 1, title: 'Machine Setup', instruction: 'Adjust the seat so the pivot point aligns with the middle of your torso. Grip the handles lightly for support only — not to pull.', cue: 'Pivot at mid-torso. Light grip on handles — abs do the work.' },
      { number: 2, title: 'Initiation — Spine Flexion', instruction: 'The movement must be initiated by CURLING your spine forward — pulling your sternum toward your navel. This is spinal flexion, not a hip hinge. If your hips move first, you are using hip flexors, not abs.', cue: 'Sternum to navel. Spine curls. Hips stay still.' },
      { number: 3, title: 'Peak Contraction', instruction: 'Crunch as far forward as the machine allows, squeezing your abs at maximum contraction for 1 second.', cue: 'Maximum forward crunch. Squeeze abs for 1 second.' },
      { number: 4, title: 'Controlled Return', instruction: 'Resist the weight on the return — do not let it snap you back. Extend your spine slowly over 3 seconds, feeling the abs lengthen under tension.', cue: '3-second return. Resist. Abs stay engaged throughout.' },
      { number: 5, title: 'Breathing', instruction: 'Exhale forcefully as you crunch (this naturally helps abdominal contraction). Inhale on the return. Never hold your breath during abdominal work.', cue: 'Exhale on crunch. Inhale on return. Never hold breath.' }
    ]
  },
  {
    id: 'co-2',
    name: 'Forearm Core Plank',
    bodyPart: 'Core',
    level: 'Beginner',
    levelLabel: 'Low Level',
    equipment: 'Floor Exercise Mat',
    // Person doing plank
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 45,
    defaultWeight: 0,
    tip: 'Create full-body isometric tension by pulling elbows toward toes.',
    youtubeId: 'ASdvN_XEl_c',
    youtubeUrl: 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
    targetMuscle: 'Transverse Abdominis, Rectus Abdominis, Obliques, Glutes, Spinal Erectors',
    steps: [
      { number: 1, title: 'Entry Position', instruction: 'Place forearms flat on the mat, elbows directly beneath your shoulders. Hands can be flat or clasped together. Rise onto your toes. Your body forms a rigid plank from heels to head.', cue: 'Elbows under shoulders. Rigid plank. Head neutral.' },
      { number: 2, title: 'Full Body Tension Protocol', instruction: 'The secret to an effective plank: tense EVERYTHING. Squeeze your glutes hard, brace your abs like concrete, contract your quads, press your forearms into the floor. Your body should be shaking from systemic muscular tension — not sagging.', cue: 'Squeeze glutes. Brace abs. Contract quads. Press forearms down.' },
      { number: 3, title: 'The Hollow Body', instruction: 'Slightly tuck your pelvis (posteriorly tilt) — this eliminates the lumbar arch and puts your abs into maximum engagement. Your lower back should be flat, not hyperextended.', cue: 'Tuck pelvis. Flatten lower back. No lumbar arch.' },
      { number: 4, title: '"RKC Pull" Technique', instruction: 'Advanced intensification: imagine you are trying to drag your elbows toward your toes (without moving them). This creates explosive tension through the entire anterior core (abs, hip flexors, obliques) and makes a 30-second plank as challenging as a 2-minute plank.', cue: 'Drag elbows toward toes. Do not move them. Create the tension.' },
      { number: 5, title: 'Duration Progression', instruction: 'Start with 20-30 second holds. Progress to 60+ seconds with perfect tension. Once you can hold 60 seconds with complete tension, progress to harder variations (feet elevated, weighted vest, plank with reach).', cue: 'Master 60s with max tension. Then progress. Not before.' }
    ]
  },
  {
    id: 'co-3',
    name: 'Hanging Captain Chair Leg Raise',
    bodyPart: 'Core',
    level: 'Intermediate',
    levelLabel: 'Mid Level',
    equipment: "Captain's Chair Tower",
    image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 0,
    tip: 'Curl pelvis up at the top of movement to fully activate lower abdominals.',
    youtubeId: 'l4kQd9eWclE',
    youtubeUrl: 'https://www.youtube.com/watch?v=l4kQd9eWclE',
    targetMuscle: 'Rectus Abdominis (Lower), Hip Flexors, Obliques',
    steps: [
      { number: 1, title: 'Mount Position', instruction: 'Mount the captain\'s chair station by pressing your forearms and upper back against the pads. Grip the handles. Lower legs hanging freely. Core already lightly braced.', cue: 'Forearms on pads. Upper back against rest. Legs hanging.' },
      { number: 2, title: 'Posterior Pelvic Tilt — The Key', instruction: 'Before raising your legs, tilt your pelvis BACKWARD (flatten your lower back against the pad). This ensures the abdominals, not just the hip flexors, do the work. Without this tilt, this becomes a pure hip flexor exercise.', cue: 'Tilt pelvis back FIRST. Lower back flat. Then raise legs.' },
      { number: 3, title: 'The Raise', instruction: 'Exhale and raise your knees toward your chest, maintaining the posterior pelvic tilt. At the top, allow your pelvis to curl further upward — this is the "posterior pelvic curl" that fully contracts the lower rectus abdominis.', cue: 'Knees to chest. Curl pelvis further at the top. That curl is everything.' },
      { number: 4, title: 'Controlled Descent', instruction: 'Lower your legs slowly over 3-4 seconds. Maintain the posterior pelvic tilt throughout. Do not swing your legs or use momentum — this is extremely common and dramatically reduces effectiveness.', cue: '4-second descent. No swinging. Abs always taut.' },
      { number: 5, title: 'Progression to Straight Legs', instruction: 'Bent-knee raises are the starting point. Once you can do 15 with perfect form, progress to straight-leg raises — dramatically harder. Eventually, add weight by holding a dumbbell between your feet.', cue: 'Bent knees → straight legs → weighted. Progressive overload.' }
    ]
  },

  // ── CARDIO ──
  {
    id: 'ca-1',
    name: 'Incline Treadmill Power Walk',
    bodyPart: 'Cardio',
    level: 'Beginner',
    levelLabel: 'Low Level',
    equipment: 'Commercial Treadmill',
    image: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=600&q=80',
    defaultSets: 1,
    defaultReps: 25,
    defaultWeight: 0,
    tip: '12% incline at 5 km/h: high caloric burn with zero joint impact.',
    youtubeId: '8i3VnRdVQzy',
    youtubeUrl: 'https://www.youtube.com/watch?v=8i3VnRdVQzy',
    targetMuscle: 'Glutes, Hamstrings, Calves, Cardiovascular System',
    steps: [
      { number: 1, title: 'Treadmill Setup', instruction: 'Set treadmill to 10-12% incline and a walking pace of 4.5-6 km/h. This combination creates a massive caloric demand without the impact of running.', cue: '10-12% incline. 4.5-6 km/h walking pace.' },
      { number: 2, title: 'DO NOT Hold the Handrails', instruction: 'The most important rule of incline treadmill walking: keep your hands OFF the rails. Holding the rails dramatically reduces caloric expenditure by up to 25%. Swing your arms naturally for maximum effort.', cue: 'Hands off the rails. Swing arms. This is the rule.' },
      { number: 3, title: 'Posture', instruction: 'Walk tall with chest proud, slight forward lean from the ankles (not the waist). Engage your glutes with every step push-off. Your eyes look forward, not at the ground.', cue: 'Tall posture. Forward lean from ankles. Glutes engaged each step.' },
      { number: 4, title: 'Duration', instruction: 'Aim for 20-45 minutes. Use heart rate zones: target 60-70% of maximum heart rate for fat oxidation (aerobic steady state). This is the famous "Zone 2" cardio that elite athletes prioritize.', cue: '20-45 minutes. Zone 2 HR (60-70% max HR). Steady and sustainable.' },
      { number: 5, title: 'Fasted vs Fed Cardio', instruction: 'Walking at 12% incline is one of the best fasted cardio choices — low enough intensity to not break down muscle tissue, high enough to access fat stores. Morning before breakfast is the optimal time for this protocol.', cue: 'Morning fasted cardio = optimal fat mobilisation.' }
    ]
  },
  {
    id: 'ca-2',
    name: 'Concept2 Rowing Machine (Rower)',
    bodyPart: 'Cardio',
    level: 'Beginner',
    levelLabel: 'Low Level',
    equipment: 'Rowing Ergometer',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
    defaultSets: 3,
    defaultReps: 500,
    defaultWeight: 0,
    tip: 'Sequence: Drive with legs, lean hips back, pull handle to sternum.',
    youtubeId: 'zQ82RYIFLN8',
    youtubeUrl: 'https://www.youtube.com/watch?v=zQ82RYIFLN8',
    targetMuscle: '86% of muscle groups — Full Body Cardio King',
    steps: [
      { number: 1, title: 'The Catch Position', instruction: 'Sit at the front of the machine with shins vertical, arms extended forward gripping the handle, body leaned slightly forward. This is the "catch" — where you begin each stroke.', cue: 'Shins vertical. Arms forward. Slight forward lean. Catch.' },
      { number: 2, title: 'The Drive — Legs First', instruction: 'LEGS first: drive through your feet and extend your legs explosively. Do NOT bend your arms yet. Approximately 60% of rowing power comes from the legs.', cue: 'Legs push FIRST. Arms stay straight. 60% of your power is here.' },
      { number: 3, title: 'Body Lean', instruction: 'As your legs approach extension, lean your torso backward from the hips to about 1 o\'clock position (slightly past vertical).', cue: 'Legs extended → body lean back to 1 o\'clock.' },
      { number: 4, title: 'The Pull', instruction: 'Finally, pull the handle to your lower sternum with elbows driving back and outward. Squeeze your shoulder blades together at the finish. This is the "finish" position.', cue: 'Handle to lower sternum. Elbows back and out. Squeeze shoulder blades.' },
      { number: 5, title: 'The Recovery', instruction: 'Reverse the sequence: arms extend first, then body leans forward, then knees bend and you slide forward to the catch. The recovery takes about twice as long as the drive for maximum efficiency and heart rate control.', cue: 'Recovery: arms → body → legs. Take twice as long as the drive.' }
    ]
  },
  {
    id: 'ca-3',
    name: 'Assault Fan AirBike',
    bodyPart: 'Cardio',
    level: 'Advanced',
    levelLabel: 'High Level',
    equipment: 'Fan Resistance AirBike',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
    defaultSets: 5,
    defaultReps: 30,
    defaultWeight: 0,
    tip: 'High-intensity interval conditioning that pushes VO2 max to peak.',
    youtubeId: 'Cq_7493rP4M',
    youtubeUrl: 'https://www.youtube.com/watch?v=Cq_7493rP4M',
    targetMuscle: 'Full Body — Cardiovascular System, VO2 Max',
    steps: [
      { number: 1, title: 'Seat Height', instruction: 'Adjust seat so your knee has a very slight bend at the bottom of each pedal stroke. Too low = knee strain. Too high = inefficient power transfer.', cue: 'Slight knee bend at pedal bottom. Not fully extended, not cramped.' },
      { number: 2, title: 'Full Body Engagement', instruction: 'Unlike a regular bike, push AND pull the handles simultaneously with your arms while pedaling. The handles and pedals are linked — pushing with one arm while pulling with the other amplifies output.', cue: 'Push and pull simultaneously. Every limb working in opposition.' },
      { number: 3, title: 'HIIT Protocol', instruction: 'The most effective AirBike protocol: 30 seconds all-out effort (maximum pedal rate), 30 seconds complete rest. Repeat 8-10 rounds. This is brutally effective for conditioning, fat loss, and VO2 max development.', cue: '30s ALL OUT. 30s rest. 8-10 rounds. Pure suffering = pure results.' },
      { number: 4, title: 'Steady State Option', instruction: 'Alternatively, maintain a consistent moderate-high effort for 15-20 minutes. The fan resistance auto-adjusts to your effort — the harder you push, the more resistance. There is no cheating the AirBike.', cue: 'Steady moderate effort = perfect fat burning cardio tool.' },
      { number: 5, title: 'Breathing', instruction: 'On the AirBike at high intensity, controlled breathing is nearly impossible — and that is fine. Just keep breathing and do not hold your breath. As fitness improves, your breathing will become more rhythmic.', cue: 'Keep breathing. No holding. Rhythm comes with fitness.' }
    ]
  }
];
