/* Offline demo data. When config.js contains an Apps Script URL, questions and
   scores are read and verified by the Google Sheets backend instead. */
window.BioData = (() => {
  const rounds = {
    "First Year": [
      ["Easy", [
        { direction: "Across", number: 1, clue: "Technique used to amplify DNA, abbreviated (3)", answer: "PCR", category: "Amplification", points: 1 },
        { direction: "Across", number: 3, clue: "Enzyme that joins DNA fragments together (6)", answer: "LIGASE", category: "Enzymes", points: 1 },
        { direction: "Across", number: 5, clue: "Biological catalyst, e.g. a restriction ___ (6)", answer: "ENZYME", category: "Enzymes", points: 1 },
        { direction: "Across", number: 6, clue: "Vehicle (e.g. plasmid) used to carry DNA into a cell (6)", answer: "VECTOR", category: "Molecular biology", points: 1 },
        { direction: "Across", number: 8, clue: "Three-nucleotide sequence that codes for an amino acid (5)", answer: "CODON", category: "Genetics", points: 1 },
        { direction: "Across", number: 11, clue: "Observable physical traits resulting from genotype (9)", answer: "PHENOTYPE", category: "Genetics", points: 1 },
        { direction: "Across", number: 14, clue: "Common text-based file format for sequence data (5)", answer: "FASTA", category: "File formats", points: 1 },
        { direction: "Across", number: 15, clue: "Coding segment of a gene retained in mature mRNA (4)", answer: "EXON", category: "Gene structure", points: 1 },
        { direction: "Across", number: 16, clue: "Non-coding segment removed during RNA splicing (6)", answer: "INTRON", category: "Gene structure", points: 1 },
        { direction: "Across", number: 17, clue: "Single-stranded nucleic acid that carries out protein synthesis (3)", answer: "RNA", category: "Molecular biology", points: 1 },
        { direction: "Down", number: 1, clue: "Short DNA strand that initiates replication in PCR (6)", answer: "PRIMER", category: "Molecular biology", points: 1 },
        { direction: "Down", number: 2, clue: "One of two or more versions of a gene (6)", answer: "ALLELE", category: "Genetics", points: 1 },
        { direction: "Down", number: 4, clue: "Complete set of an organism's genetic material (6)", answer: "GENOME", category: "Genomics", points: 1 },
        { direction: "Down", number: 7, clue: "A change in a DNA sequence (8)", answer: "MUTATION", category: "Genetics", points: 1 },
        { direction: "Down", number: 9, clue: "Ordered list of nucleotides or amino acids (8)", answer: "SEQUENCE", category: "Bioinformatics", points: 1 },
        { direction: "Down", number: 10, clue: "Double helix molecule that stores genetic information (3)", answer: "DNA", category: "Molecular biology", points: 1 },
        { direction: "Down", number: 11, clue: "Small circular DNA molecule found in bacteria (7)", answer: "PLASMID", category: "Microbiology", points: 1 },
        { direction: "Down", number: 12, clue: "Folded chain of amino acids (7)", answer: "PROTEIN", category: "Biochemistry", points: 1 },
        { direction: "Down", number: 13, clue: "Basic unit of heredity (4)", answer: "GENE", category: "Genetics", points: 1 }
      ]],
      ["Moderate", [
        ["The process by which DNA makes a copy of itself (11)", "REPLICATION", "Genetics"],
        ["Making RNA from a DNA template (13)", "TRANSCRIPTION", "Molecular biology"],
        ["Making protein from an mRNA message (11)", "TRANSLATION", "Molecular biology"],
        ["A three-base sequence on mRNA (5)", "CODON", "Genetics"],
        ["A change in the DNA sequence (8)", "MUTATION", "Genetics"],
        ["The cell division that makes gametes (7)", "MEIOSIS", "Cell biology"],
        ["The cell division for growth and repair (7)", "MITOSIS", "Cell biology"],
        ["A small circular DNA molecule in bacteria (7)", "PLASMID", "Microbiology"],
        ["A fragment of DNA used for study (5)", "CLONE", "Genetics"],
        ["A method that amplifies a DNA sequence (3)", "PCR", "Bioinformatics"]
      ]],
      ["Hard", [
        ["Study of evolutionary relatedness (10)", "PHYLOGENY", "Evolution"],
        ["A two-dimensional protein sequence alignment (9)", "PAIRWISE", "Bioinformatics"],
        ["A reference collection of biological sequences (8)", "DATABASE", "Bioinformatics"],
        ["The complete RNA transcript collection (11)", "TRANSCRIPTOME", "Genomics"],
        ["The complete protein collection of an organism (8)", "PROTEOME", "Proteomics"],
        ["The study of how genes are expressed (11)", "EPIGENETICS", "Genetics"],
        ["A sequence variation at one base (3)", "SNP", "Genomics"],
        ["A hidden Markov model is often used for this (9)", "ALIGNMENT", "Bioinformatics"],
        ["The branch of biology using computation and data (14)", "BIOINFORMATICS", "Bioinformatics"],
        ["The visible traits of an organism (9)", "PHENOTYPE", "Genetics"]
      ]]
    ],
    "Second Year": [
      ["Easy", [
        ["MENGEO", "GENOME", "Complete genetic material"], ["AEND", "DNA", "Genetic molecule"], ["AENMIG", "GENE", "DNA trait unit"], ["NRA", "RNA", "Single-stranded nucleic acid"], ["NZOYEME", "ENZYME", "Reaction catalyst"], ["SEBLA", "BASE", "DNA letter"], ["DCOON", "CODON", "Three-base mRNA unit"], ["LELACE", "ALLELE", "Gene version"], ["NHIARPC", "CHROMATIN", "DNA and protein complex"], ["LCLE", "CELL", "Basic unit of life"]
      ]],
      ["Moderate", [
        ["TOMUATIN", "MUTATION", "DNA sequence change"], ["TIAOCIRPLNEA", "REPLICATION", "Copying DNA"], ["SCONRTIPRATN", "TRANSCRIPTION", "RNA synthesis"], ["TASNLRAOITN", "TRANSLATION", "Protein synthesis"], ["SMOLPAID", "PLASMID", "Circular bacterial DNA"], ["TRTIEA", "TRAIT", "Inherited characteristic"], ["SEIOMIS", "MEIOSIS", "Gamete cell division"], ["TSMISOI", "MITOSIS", "Growth cell division"], ["TURSCRET", "STRUCTURE", "Arrangement of parts"], ["SEQUENCNIG", "SEQUENCING", "Reading bases"]
      ]],
      ["Hard", [
        ["PHEYNGLO", "PHYLOGENY", "Evolutionary history"], ["PRTOEOME", "PROTEOME", "All proteins"], ["TRSANRIPTCMTOE", "TRANSCRIPTOME", "All RNA transcripts"], ["NIDGLAMEANT", "ALIGNMENT", "Sequence matching"], ["ABTDAAES", "DATABASE", "Structured data collection"], ["NTAIOVRAI", "VARIATION", "Genetic difference"], ["NTAIAMNNIO", "ANNOTATION", "Adding biological meaning"], ["NOMRGTIEA", "MIGRATION", "Movement of populations"], ["LEOPHNYETP", "PHENOTYPE", "Observable traits"], ["CHROTMAOSOME", "CHROMOSOME", "DNA package"]
      ]]
    ],
    "Third Year": [
      ["Moderate", [
        ["GORLIHTAM", "ALGORITHM", "Step-by-step computational method"], ["HEISURTIC", "HEURISTIC", "Practical problem-solving rule"], ["NATAGMCOET", "CONTIG", "Overlapping assembled DNA segment"], ["AXSEFDFO", "FASTQ", "Sequencing read file format"], ["YLRARIB", "LIBRARY", "Prepared sequencing sample collection"], ["MMGPAIN", "MAPPING", "Placing reads on a reference"], ["NATOVCIAR", "VARIATION", "Difference in a sequence"], ["NEXOP", "EXON", "Expressed coding sequence"], ["NTORIN", "INTRON", "Removed RNA segment"], ["TIFOAMRNNCI", "INFORMATICS", "Information processing field"]
      ]],
      ["Hard", [
        ["MTOISUEDEGNA", "METAGENOMICS", "Study of mixed-community genomes"], ["YGEONMSICANOL", "GENOMICALLY", "Relating to genomes"], ["HYGOPLENY", "PHYLOGENY", "Evolutionary tree history"], ["RBICEDOAMITEN", "MICROBIOME", "Microbial community"], ["SASOITINACOL", "LOCALISATION", "Finding sequence location"], ["TATSICSTI", "STATISTICS", "Data analysis discipline"], ["MOSIUATNLMI", "SIMULATION", "Model-based experiment"], ["HRIAEGNCE", "ENRICHAGE", "Overrepresentation analysis"], ["NAGEONMSECS", "GENOMESCAN", "Genome-wide search"], ["NEOGLAORTIHMT", "ALGORITHM", "Computational method"]
      ]],
      ["Expert", [
        ["ETRAHAGMONO", "HOMOGENATE", "Make a uniform biological mixture"], ["MTCYEINHEGC", "CHEMIGENETIC", "Chemical control of gene activity"], ["PHETNOGNEESI", "EPIGENETICS", "Heritable expression changes"], ["MTRSNOACRIPTT", "TRANSCRIPTOM", "RNA-expression dataset"], ["OETPORIMNCS", "PROTEOMICS", "Large-scale protein study"], ["OYSPHGELNY", "PHYLOGENY", "Evolutionary relationships"], ["TIGCENON", "CONTIG", "Assembled contiguous sequence"], ["HAPPYOTGELN", "PHYLOGENY", "Evolutionary lineage"], ["NERUEAOLN", "NEURAL", "Relating to neural networks"], ["AFTISCAINR", "FAIRNESS", "Responsible-data principle"]
      ]]
    ]
  };

  const questionRows = Object.entries(rounds).flatMap(([year, roundSets]) => roundSets.flatMap(([difficulty, entries], roundIndex) =>
    entries.map((entry, questionIndex) => {
      const isObject = entry && typeof entry === "object" && !Array.isArray(entry);
      const display = isObject ? entry.clue : entry[0];
      const answer = isObject ? entry.answer : entry[1];
      const category = isObject ? entry.category : entry[2];
      const direction = isObject ? entry.direction : "";
      const number = isObject ? entry.number : questionIndex + 1;
      const points = isObject && Number(entry.points) ? Number(entry.points) : 10;
      return {
        id: isObject ? `${year[0]}Y-R${roundIndex + 1}-${direction[0]}${String(number).padStart(2, "0")}` : `${year[0]}Y-R${roundIndex + 1}-${String(questionIndex + 1).padStart(2, "0")}`,
        year, round: roundIndex + 1, difficulty, category, direction, number,
        clue: year === "First Year" ? display : `Unscramble the letters to find the ${category.toLowerCase()}.`,
        jumble: year === "First Year" ? "" : display, answer, points,
        type: year === "First Year" ? "crossword" : "jumble"
      };
    })
  ));

  return {
    settings: { eventName: "Bioinformatics Event 2026", eventLive: true, durationMinutes: 10, passingScore: 60 },
    competitions: {
      "First Year": { name: "Bioinformatics Crossword", type: "crossword", difficulties: ["Easy", "Moderate", "Hard"] },
      "Second Year": { name: "Bioinformatics Jumble Words", type: "jumble", difficulties: ["Easy", "Moderate", "Hard"] },
      "Third Year": { name: "Advanced Bioinformatics Jumble Words", type: "jumble", difficulties: ["Moderate", "Hard", "Expert"] }
    },
    questions: questionRows,
    leaderboard: [
      { name: "Priya Nair", className: "B.Sc. Bioinformatics", year: "First Year", score: 120, timeTaken: 490 },
      { name: "Rahul Verma", className: "B.Sc. Biotechnology", year: "First Year", score: 115, timeTaken: 520 },
      { name: "Sneha Patel", className: "B.Sc. Bioinformatics", year: "First Year", score: 110, timeTaken: 538 },
      { name: "Karthik Reddy", className: "B.Sc. Microbiology", year: "First Year", score: 105, timeTaken: 560 },
      { name: "Madhumitha S", className: "B.Sc. Bioinformatics", year: "First Year", score: 98, timeTaken: 583 },
      { name: "Dev Patel", className: "B.Sc. Biotechnology", year: "Second Year", score: 128, timeTaken: 475 },
      { name: "Aisha Khan", className: "M.Sc. Bioinformatics", year: "Second Year", score: 114, timeTaken: 525 },
      { name: "Rohan Das", className: "B.Sc. Bioinformatics", year: "Second Year", score: 102, timeTaken: 558 },
      { name: "Meera Iyer", className: "M.Sc. Bioinformatics", year: "Third Year", score: 130, timeTaken: 510 },
      { name: "Arjun Roy", className: "B.Sc. Biotechnology", year: "Third Year", score: 118, timeTaken: 544 },
      { name: "Nisha Bose", className: "B.Sc. Bioinformatics", year: "Third Year", score: 106, timeTaken: 580 }
    ]
  };
})();
