export interface WarmupMetadata {
  title: string;
  description: string;
  expectedNotes: number[];
}

// Semitone offsets from the root selected in the practice controls. Empty arrays
// intentionally represent activities without one source-confirmed monophonic line.
const ALL_WARMUPS: WarmupMetadata[] = [
  { title: "Major Scale", description: "Sing an ascending major scale with even tone, clear vowel shape, and consistent breath support.", expectedNotes: [0, 2, 4, 5, 7, 9, 11, 12] },
  { title: "Natural Minor Scale", description: "Sing an ascending natural minor scale with an even, connected tone through every degree.", expectedNotes: [0, 2, 3, 5, 7, 8, 10, 12] },
  { title: "Lip Trills", description: "Use lip trills through the written rising and falling patterns to coordinate steady breath and relaxed phonation.", expectedNotes: [] },
  { title: "Breathe and Hiss", description: "Inhale for four counts, then sustain a hiss; lengthen the exhale across successive repetitions.", expectedNotes: [] },
  { title: "Koy-Yah", description: "Sing the written Koy-Yah pattern, using the crisp consonant to connect articulation and breath.", expectedNotes: [] },
  { title: "Consonant Craziness", description: "Assign unvoiced consonants and contrasting rhythms to groups to build breath energy and rhythmic independence.", expectedNotes: [] },
  { title: "Legato Solfeggio", description: "Sustain the written line with connected airflow; once secure, repeat it on a hum or a single vowel.", expectedNotes: [] },
  { title: "Tee-Hee-Hee", description: "Use the articulated written pattern to connect breath, precision, and vocal agility.", expectedNotes: [] },
  { title: "ABCs", description: "Sing the alphabet in one breath, gradually slowing the tempo to strengthen sustained airflow.", expectedNotes: [] },
  { title: "Air Elevator", description: "Trace a hand from sternum to waist while inhaling, then return it slowly during a suspended hiss.", expectedNotes: [] },
  { title: "Dive Up", description: "Inhale with arms raised and lower them during a hiss while keeping the ribs expanded and lifted.", expectedNotes: [] },
  { title: "Power Breaths", description: "Expand the arms on a one-count inhale, then release all air on an open rounded vowel while bringing the hands together.", expectedNotes: [] },

  { title: "Tee-Eee, Tee-Ay, Tee-Ah", description: "Sing the written syllable pattern with clean articulation and an energized breath connection.", expectedNotes: [] },
  { title: "Ni-No-Ni", description: "Carry the open space of the o vowel into i, and the forward focus of i into o, through the written pattern.", expectedNotes: [] },
  { title: "I Sigh to Sing", description: "Sing the written phrase with the relaxed, open sensation of beginning a yawn.", expectedNotes: [] },
  { title: "Trill to Vowel", description: "Lip trill upward from Do through Fa, then descend from Sol to Do on a vowel; move from i toward more open vowels.", expectedNotes: [0, 2, 4, 5, 7, 5, 4, 2, 0] },
  { title: "Nordic Tune", description: "Start the written tune on a hum, balancing warm depth and bright focus, then explore it on different vowels.", expectedNotes: [] },
  { title: "Nee Voo Nee", description: "Use the n and v consonants in the written pattern to maintain a forward, focused sound.", expectedNotes: [] },
  { title: "Ming Oh", description: "Sing the written pattern to develop forward resonance and ring in the tone.", expectedNotes: [] },
  { title: "Bee-Ay-Bay", description: "Use the written phrase for a free tone and pure vowels; vary the opening consonant on later repetitions.", expectedNotes: [] },
  { title: "The Three Bears", description: "Sing America the Beautiful three ways: overly nasal, overly dark, then with a balanced healthy resonance.", expectedNotes: [] },

  { title: "Robert Shaw Interval Fun", description: "Sing the written u-a-u-a-u vowel series with especially accurate intervals and pure vowels.", expectedNotes: [] },
  { title: "Mi-Me-Ma-Mo-Mu", description: "Repeat the vowel sequence on one pitch while pairing each vowel with its prescribed hand gesture.", expectedNotes: [0] },
  { title: "Chord Fun", description: "Build a Do-Mi-Sol-Do chord on a, allowing singers to choose a chord member in any octave, then enter together.", expectedNotes: [] },
  { title: "Solfege Round", description: "Perform the written solfège line as a round between rows or sections; add Curwen signs if useful.", expectedNotes: [] },
  { title: "Interval Up and Down", description: "Sing the written interval exercise accurately, then repeat it on a neutral nu syllable.", expectedNotes: [] },
  { title: "Interval Insanity", description: "Practice the written interval pattern for accuracy, then transfer it to the neutral syllable nu.", expectedNotes: [] },
  { title: "I Know", description: "Sing the written I Know exercise, focusing on accurate listening and pitch placement.", expectedNotes: [] },
  { title: "Interval Hopping", description: "Establish the tonic, then begin the written pattern from a degree other than Do to strengthen interval awareness.", expectedNotes: [] },
  { title: "Chromatic Conundrum", description: "Sing a unison chromatic scale up and down; advanced groups move upward and downward simultaneously from opposite Dos.", expectedNotes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0] },

  { title: "Vi-Va", description: "Start the written eighth-note pattern slowly, then increase tempo without losing accuracy or articulation.", expectedNotes: [] },
  { title: "Leaky Boat", description: "Sing the written song, accelerating gently on each repetition as the imaginary boat sinks.", expectedNotes: [] },
  { title: "Pizza Is Great!", description: "Use the written phrase as one connected breath; crescendo after great rather than breathing, then carry momentum to the end.", expectedNotes: [] },
  { title: "Ya Ha Ha Ha", description: "Use the short version for breath connection and the longer version for greater agility and range challenge.", expectedNotes: [] },
  { title: "Dee Dee Do", description: "Sing the written phrase on one breath and shape it as one long continuous musical line.", expectedNotes: [] },
  { title: "Whippy Dip", description: "Sing the written phrase and optionally add a third above on the descent for upper voices; vary the destination text for fun.", expectedNotes: [] },
  { title: "Sing EE-AY-AH", description: "Use the written pattern to combine breath connection, vowel formation, agility, and phrase shaping.", expectedNotes: [] },
  { title: "Back and Forth", description: "Sing the written changing-direction phrase, shaping it as four deliberate musical phrases.", expectedNotes: [] },
  { title: "Sirens and Sighs", description: "Glide freely between pitches with an open, relaxed, unforced sound.", expectedNotes: [] },

  { title: "Zinga-Zinga-Zoo", description: "Add linked-arm movement: lean left, lean right, then twist on the final zinga-zinga while singing the written piece.", expectedNotes: [] },
  { title: "My Bonnie Lies Over the Ocean", description: "Stand or sit whenever a sung word begins with b; repeat a semitone higher and gradually increase speed.", expectedNotes: [] },
  { title: "Tractor Pull", description: "Partners lean away while ascending 1-2-3-4-5, then use core engagement to return upright on the descent.", expectedNotes: [0, 2, 4, 5, 7, 5, 4, 2, 0] },
  { title: "Head, Shoulders, Knees and Toes", description: "Use the familiar physical song, optionally reversing its order for an added coordination challenge.", expectedNotes: [] },
  { title: "Stretch and Pat Down", description: "After stretching, pat down from head to toes and finish with face and jaw massage to release tension.", expectedNotes: [] },
  { title: "20 Seconds to Loose", description: "Slowly melt from tall posture into a relaxed fold over twenty counts, then roll back up over twenty with shoulder rolls.", expectedNotes: [] },
  { title: "Yup-Ti", description: "Sing the energetic written agility exercise and add choreography to engage the whole body.", expectedNotes: [] },
  { title: "5, 4, 3, 2, 1... Conduct!", description: "Sing 1-2-3-4-5-4-3-2-1-2 with a rounded tone while mirroring a changing four-pattern conducting gesture.", expectedNotes: [0, 2, 4, 5, 7, 5, 4, 2, 0, 2] },
  { title: "Elastic Choir", description: "Imagine stretching an elastic band at waist level while singing the written phrase, then reset the hands on each breath.", expectedNotes: [] },
  { title: "Stir the Pot", description: "Sing the written warm-up while using the accompanying physical stirring gesture.", expectedNotes: [] },

  { title: "O Is Very Useful", description: "Sing the written exercise using the o vowel as its central vocal focus.", expectedNotes: [] },
  { title: "Dynamic Destination", description: "Hold a Do-Sol-Mi-Do chord on a and travel through numbered dynamic levels from 1 to 8 and back, then jump between levels.", expectedNotes: [] },
  { title: "Sigh on Pitch", description: "Add a defined pitch to an easy sigh, beginning higher and moving downward to encourage release and register transition.", expectedNotes: [] },
  { title: "Choose Your Own Adventure!", description: "Turn a difficult excerpt or concept from current repertoire into a focused warm-up tailored to the ensemble.", expectedNotes: [] }
];

export const WARMUP_CATALOGUE = ALL_WARMUPS.filter((warmup) => warmup.expectedNotes.length > 2);
