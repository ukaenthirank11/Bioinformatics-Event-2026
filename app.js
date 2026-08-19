(() => {
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const storageKey = "biofest-participant-v2";
  const progressKey = "biofest-progress-v2";
  const freshProgress = () => ({ round: 1, questionIndex: 0, answers: {}, roundScore: 0, baseScore: 0, startedAt: null, questions: [] });
  let student = JSON.parse(localStorage.getItem(storageKey) || "null");
  let progress = JSON.parse(localStorage.getItem(progressKey) || "null") || freshProgress();
  let leaderboardRows = [];

  const registered = () => Boolean(student && student.name && student.year);
  const competition = () => BioData.competitions[student?.year] || BioData.competitions["First Year"];
  const currentRound = () => Math.max(1, Math.min(3, Number(student?.currentRound || progress.round || 1)));
  const localQuestions = () => BioData.questions.filter(q => q.year === student?.year && q.round === currentRound());
  const questions = () => progress.questions?.length ? progress.questions : localQuestions();
  const duration = () => (Number(BioData.settings.durationMinutes) || 10) * 60;
  const roundPoints = list => (list || questions()).reduce((sum, item) => sum + (Number(item.points) || 0), 0);
  const roundPassMark = list => competition().type === "crossword" ? roundPoints(list || questions()) : Math.max(10, Math.ceil(roundPoints(list) * 0.6));
  const escapeHtml = value => String(value || "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", "\"": "&quot;" }[character]));
  const clean = value => String(value || "").trim().replace(/\s+/g, " ");
  const save = () => {
    if (student) localStorage.setItem(storageKey, JSON.stringify(student)); else localStorage.removeItem(storageKey);
    localStorage.setItem(progressKey, JSON.stringify(progress));
  };

  async function api(action, payload = {}, method = "POST") {
    if (!window.BIO_SHEETS_API_URL) return null;
    try {
      let response;
      if (method === "GET") {
        response = await fetch(window.BIO_SHEETS_API_URL + "?" + new URLSearchParams({ action, ...payload }));
      } else {
        response = await fetch(window.BIO_SHEETS_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
          body: new URLSearchParams({ action, ...payload }).toString()
        });
      }
      if (!response.ok) throw new Error("The Sheets service is unavailable.");
      return response.json();
    } catch (error) {
      return null;
    }
  }

  function mergeQuestionData(remoteRows) {
    const localMap = new Map(BioData.questions.map(question => [question.id, question]));
    return (remoteRows || []).map(row => ({ ...(localMap.get(row.id) || {}), ...row }));
  }

  async function syncFromServer() {
    if (!window.BIO_SHEETS_API_URL || !student?.id) return;
    const result = await api("status", { studentId: student.id }, "GET");
    if (!result?.ok || !result.student) return;
    student = { ...student, ...result.student };
    progress.round = Number(student.currentRound || progress.round || 1);
    progress.baseScore = Number(student.score || progress.baseScore || 0);
    if (student.roundStartedAt && Number(student.roundStartedNumber || 0) === currentRound()) {
      progress.startedAt = new Date(student.roundStartedAt).getTime();
      const remoteQuestions = await api("questions", { studentId: student.id, round: currentRound() });
      progress.questions = remoteQuestions?.rows?.length ? mergeQuestionData(remoteQuestions.rows) : progress.questions;
    }
    save();
  }

  function message(selector, text = "", state = "") {
    const target = $(selector);
    target.textContent = text;
    target.className = state ? "answer-feedback " + state : "answer-feedback";
  }

  function setIdentity() {
    const name = registered() ? student.name : "Guest participant";
    const first = registered() ? name.split(/\s+/)[0] : "Scientist";
    const courseYear = registered() ? student.year : "Register to play";
    $$("[data-student-name]").forEach(node => node.textContent = name);
    $$("[data-student-first]").forEach(node => node.textContent = first);
    $$("[data-student-year]").forEach(node => node.textContent = courseYear);
    $$("[data-initial]").forEach(node => node.textContent = first.slice(0, 1).toUpperCase());
    $("#profileClass").textContent = registered() ? student.className : "Join the event to play";
    $("#profileYear").textContent = registered() ? student.year : "Not registered";
    $("#profileCompetition").textContent = registered() ? competition().name : "—";
    $("#profileRound").textContent = registered() ? "Round " + currentRound() + " of 3" : "—";
    $("#profileScore").textContent = Number(student?.score || 0) + " points";
    $("#registeredDate").textContent = registered() ? new Date(student.registeredAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
    $("#competitionName").textContent = registered() ? competition().name : "Choose your competition";
    $("#competitionBlurb").textContent = registered() ? (competition().type === "crossword" ? "Solve 19 crossword clues, one point per word, just like the reference puzzle." : "Unscramble key terms and prove your command of computational biology.") : "Register with your class and year to open the right competition.";
    $("#welcomeMessage").textContent = registered() ? "Your " + student.year + " challenge is ready when you are." : "Register once, then your competition is selected automatically.";
    $("#startRound").textContent = registered() ? "Start Round " + currentRound() + " →" : "Join the event →";
    $("#eventStatus").textContent = BioData.settings.eventLive ? "Event is live" : "Event paused";
    $("#gameTitle").textContent = competition().name;
    $("#leaderboardYear").textContent = registered() ? student.year.toUpperCase() : "ACADEMIC YEAR";
    $("#leaderboardCopy").textContent = registered() ? "Live rankings for " + competition().name + "." : "Register to see the leaderboard for your academic year.";
    $("#activityRound").textContent = registered() ? "Round " + currentRound() + (Number(student.completedRounds || 0) >= 3 ? " complete" : " awaits") : "Round 1 awaits";
    $("#activityText").textContent = registered() ? "You have completed " + Number(student.completedRounds || 0) + " of 3 rounds." : "Register to begin your journey.";
    $("#activityState").textContent = registered() && Number(student.completedRounds || 0) >= 3 ? "DONE" : "NEXT";
  }

  function renderRounds() {
    const completed = Number(student?.completedRounds || 0);
    const round = currentRound();
    const cards = competition().difficulties.map((difficulty, index) => {
      const number = index + 1;
      const done = registered() && completed >= number;
      const ready = registered() && number === round && !done;
      const status = done ? "Completed" : ready ? "Ready to play" : registered() ? "Locked" : "Register first";
      return '<article class="round-card ' + (ready || done ? "" : "locked") + '"><span class="round-number">' + String(number).padStart(2, "0") + '</span><span class="round-status ' + (ready || done ? "ready" : "locked") + '">' + (done ? "✓ " : "") + status + '</span><h3>Round ' + number + '</h3><p>' + difficulty + ' challenge</p><div class="round-dots"><i class="' + (done ? "active" : "") + '"></i><i class="' + (done ? "active" : "") + '"></i><i class="' + (done ? "active" : "") + '"></i></div></article>';
    });
    $("#roundCards").innerHTML = cards.join("");
    $("#journeyProgress").textContent = Math.round((completed / 3) * 100) + "%";
    const difficulty = competition().difficulties[round - 1];
    $("#nextRoundLabel").innerHTML = 'Round ' + round + ': <span id="difficultyLabel">' + difficulty + '</span>';
    const currentList = localQuestions();
    const pointValue = currentList.length ? Number(currentList[0].points || 10) : 10;
    $("#gamePrompt").textContent = registered() ? currentList.length + " " + (competition().type === "crossword" ? "crossword clues" : "jumbled words") + " await you." : "Register to unlock your first challenge.";
    $("#roundPoints").textContent = pointValue + " point" + (pointValue === 1 ? "" : "s") + " per answer";
    $("#roundDuration").textContent = Math.round(duration() / 60) + " minutes total";
    $("#passingScoreNote").textContent = competition().type === "crossword" ? "Solve all " + roundPoints(currentList) + " points to complete the crossword round." : "Solve " + roundPassMark(currentList) + " points to open the next round.";
  }

  function renderCrossword(question) {
    let grid = "";
    for (let row = 0; row < 11; row += 1) {
      for (let column = 0; column < 11; column += 1) {
        const active = row === 5 && column >= 2 && column < Math.min(10, 2 + Math.max(3, question.answer?.length || 5));
        const filler = (row === 1 && column >= 4 && column < 7) || (row === 3 && column >= 1 && column < 5) || (row === 8 && column >= 6 && column < 10);
        grid += '<span class="cell ' + (active ? "active" : filler ? "" : "empty") + '">' + (active && column === 2 ? "<small>1</small>" : "") + '</span>';
      }
    }
    $("#crosswordGrid").innerHTML = grid;
  }

  function renderCrosswordClues(list) {
    const clues = (list || []).filter(question => question.type === "crossword");
    const across = clues.filter(question => String(question.direction).toLowerCase() === "across");
    const down = clues.filter(question => String(question.direction).toLowerCase() === "down");
    $("#crosswordClues").hidden = !clues.length;
    const currentId = questions()[progress.questionIndex]?.id;
    const groups = [
      { title: "Across", items: across },
      { title: "Down", items: down }
    ];
    $("#crosswordClues").innerHTML = clues.length ? groups.map(group => {
      const isOpen = group.items.some(item => item.id === currentId);
      return '<details class="clue-group" ' + (isOpen ? "open" : "") + '><summary>' + group.title + '</summary><ol>' + group.items.map(item => {
        const answerState = progress.answers?.[item.id];
        const selected = item.id === currentId;
        const classes = ["clue-item"];
        if (selected) classes.push("current");
        if (answerState?.correct) classes.push("correct");
        else if (answerState) classes.push("wrong");
        return '<li><button type="button" class="' + classes.join(" ") + '" data-question-id="' + escapeHtml(item.id) + '"><span class="clue-number">' + item.number + '.</span><span class="clue-text">' + escapeHtml(item.clue) + '</span><span class="clue-state">' + (answerState?.correct ? "Solved" : answerState ? "Try again" : "") + '</span></button></li>';
      }).join("") + '</ol></details>';
    }).join("") : "";
  }

  function renderQuestion() {
    const list = questions();
    if (!registered() || !list.length) {
      $("#questionCount").textContent = "Register to begin";
      $("#questionProgress").style.width = "0%";
      $("#questionClue").textContent = "Your questions will appear after registration.";
      $("#questionCategory").textContent = "Complete your participant profile to unlock the challenge.";
      $("#crosswordGrid").innerHTML = "";
      $("#jumbleBoard").hidden = true;
      return;
    }
    progress.questionIndex = Math.max(0, Math.min(Number(progress.questionIndex || 0), list.length - 1));
    const question = list[progress.questionIndex];
    const jumble = question.type === "jumble" || competition().type === "jumble";
    const answerState = progress.answers?.[question.id];
    $("#questionCount").textContent = (competition().type === "crossword" ? "Clue " : "Question ") + (progress.questionIndex + 1) + " of " + list.length;
    $("#questionProgress").style.width = ((progress.questionIndex + 1) / list.length) * 100 + "%";
    $("#questionClue").textContent = question.clue;
    $("#questionCategory").textContent = competition().type === "crossword" && question.direction ? question.direction + " " + question.number + (question.category ? " · " + question.category : "") : (jumble ? "Hint · " : "Across · ") + question.category;
    $("#answerInput").value = answerState?.value || "";
    const pointValue = Number(question.points || 10);
    message("#answerFeedback", answerState ? (answerState.correct ? "Correct — " + pointValue + " point" + (pointValue === 1 ? "" : "s") + " added." : "Not quite. Check the clue and try again.") : "", answerState?.correct ? "correct" : answerState ? "wrong" : "");
    $("#currentClueCard").className = "clue-card" + (answerState?.correct ? " correct" : answerState ? " wrong" : "");
    $("#gameScore").textContent = Number(student.score || 0);
    $("#gameRoundTag").textContent = "ROUND " + currentRound() + " · " + (question.difficulty || competition().difficulties[currentRound() - 1]);
    $("#roundPanelNumber").textContent = "ROUND " + currentRound();
    $("#crosswordGrid").hidden = jumble;
    $("#crosswordClues").hidden = jumble;
    $("#jumbleBoard").hidden = !jumble;
    if (jumble) {
      $("#jumbleLetters").innerHTML = String(question.jumble || "BIOLOGY").split("").map(letter => "<span>" + escapeHtml(letter) + "</span>").join("");
      $("#jumbleHint").textContent = question.category || "Use the hint to identify the term.";
    } else {
      renderCrossword(question);
      renderCrosswordClues(list);
    }
    save();
  }

  function renderLeaderboard(rows) {
    const source = rows || leaderboardRows;
    const relevant = (source.length ? source : BioData.leaderboard).filter(row => !student?.year || row.year === student.year).map(row => ({ ...row }));
    if (registered()) {
      const position = relevant.findIndex(row => (row.id && row.id === student.id) || row.name.toLowerCase() === student.name.toLowerCase());
      const mine = { id: student.id || student.name.toLowerCase(), name: student.name, className: student.className, year: student.year, score: Number(student.score || 0), timeTaken: Number(student.timeTaken || 0) };
      if (position >= 0) relevant[position] = mine; else relevant.push(mine);
    }
    relevant.sort((a, b) => Number(b.score || 0) - Number(a.score || 0) || Number(a.timeTaken || 0) - Number(b.timeTaken || 0) || a.name.localeCompare(b.name));
    const rank = registered() ? relevant.findIndex(row => (row.id && row.id === student.id) || row.name.toLowerCase() === student.name.toLowerCase()) + 1 : 0;
    $("#rankValue").textContent = rank || "—";
    $("#rankCount").textContent = relevant.length ? "of " + relevant.length + " participants" : "of your year";
    $("#rankSummary").innerHTML = rank ? '<span class="rank-up">↑</span> ' + (rank <= 3 ? "You are on the podium." : "Keep playing to climb the board.") : '<span class="rank-up">↑</span> Rankings update as rounds are submitted.';
    $("#leaderboardRows").innerHTML = relevant.length ? relevant.slice(0, 12).map((row, index) => {
      const mine = registered() && ((row.id && row.id === student.id) || row.name.toLowerCase() === student.name.toLowerCase());
      return '<div class="leaderboard-row ' + (mine ? "you" : "") + '"><span class="rank-badge">' + (index + 1) + '</span><span>' + escapeHtml(row.name) + (mine ? " · You" : "") + '</span><span>' + escapeHtml(row.className) + '</span><span>' + Number(row.score || 0) + '</span></div>';
    }).join("") : '<p class="empty-state">No scores yet. Be the first to make a discovery.</p>';
    const top = relevant.slice(0, 3);
    $("#leaderboardPodium").innerHTML = [top[1], top[0], top[2]].map((row, index) => {
      const place = [2, 1, 3][index];
      const className = place === 1 ? "one" : place === 2 ? "two" : "three";
      return row ? '<div class="podium podium-' + className + '"><span>' + place + '</span><b>' + escapeHtml(row.name.split(" ")[0]) + '</b><small>' + row.score + ' pts</small></div>' : '<div class="podium podium-' + className + ' empty"><span>' + place + '</span><b>—</b><small>Awaiting score</small></div>';
    }).join("");
    return { rank, relevant };
  }

  function renderResults() {
    const completed = Number(student?.completedRounds || 0);
    const board = renderLeaderboard();
    $("#resultScore").textContent = Number(student?.score || 0);
    $("#resultRounds").textContent = completed + " / 3";
    $("#resultRank").textContent = board.rank ? "#" + board.rank : "—";
    $("#resultStatus").textContent = completed === 3 ? "All rounds complete" : "Round " + currentRound() + " is " + (registered() ? "ready" : "locked");
    $("#resultRoundsList").innerHTML = [1, 2, 3].map(round => {
      const done = completed >= round;
      const live = registered() && round === currentRound() && !done;
      return '<article class="result-round ' + (done ? "complete" : live ? "current" : "locked") + '"><span>ROUND ' + round + '</span><h3>' + competition().difficulties[round - 1] + '</h3><p>' + (done ? "Completed and passed" : live ? "Ready to play" : "Complete the previous round first") + '</p><b>' + (done ? "✓ Complete" : live ? "In progress" : "Locked") + '</b></article>';
    }).join("");
    const complete = completed === 3;
    $("#certificateTitle").textContent = complete ? "Congratulations — you completed Bioinformatics Event 2026." : "Complete all three rounds to qualify.";
    $("#certificateCopy").textContent = complete ? "Your completion certificate is now ready to download." : "Your certificate becomes available after every round is completed.";
    $("#certificateButton").disabled = !complete;
    $("#certificateButton").textContent = complete ? "Download certificate" : "Certificate locked";
  }

  function updateTimer() {
    if (!progress.startedAt || !registered() || !$("#game").classList.contains("active")) { $("#timer").textContent = "10:00"; return; }
    const remaining = Math.max(0, duration() - Math.floor((Date.now() - Number(progress.startedAt)) / 1000));
    $("#timer").textContent = String(Math.floor(remaining / 60)).padStart(2, "0") + ":" + String(remaining % 60).padStart(2, "0");
    if (!remaining && !progress.timeoutSubmitted) { progress.timeoutSubmitted = true; save(); finishRound(true); }
  }

  function switchView(view) {
    $$(".view").forEach(node => node.classList.toggle("active", node.id === view));
    $$("[data-view]").forEach(node => node.classList.toggle("active", node.dataset.view === view));
    $("#pageTitle").textContent = ({ dashboard: "Dashboard", game: "Play round", leaderboard: "Leaderboard", rules: "Rules", profile: "Profile", results: "Results", admin: "Admin desk" })[view] || "Dashboard";
    $(".sidebar").classList.remove("open");
    if (view === "results") renderResults();
    if (view === "leaderboard") refreshLeaderboard(false);
    updateTimer();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openRegistration() {
    $("#registrationMessage").textContent = "";
    $("#fullName").value = registered() ? student.name : "";
    $("#studentClass").value = registered() ? student.className : "";
    $("#studentYear").value = registered() ? student.year : "";
    $("#registrationDialog").showModal();
  }

  async function register(event) {
    event.preventDefault();
    const name = clean($("#fullName").value);
    const className = $("#studentClass").value;
    const year = $("#studentYear").value;
    if (!name || !className || !year) { $("#registrationMessage").textContent = "Please complete every field."; return; }
    const button = $("#registerButton");
    button.disabled = true; button.textContent = "Saving your place…";
    try {
      let result = await api("register", { name, className, year });
      if (!result) {
        const duplicate = BioData.leaderboard.some(row => row.name.toLowerCase() === name.toLowerCase() && row.year === year);
        if (duplicate && (!student || student.name.toLowerCase() !== name.toLowerCase())) throw new Error("This participant has already registered for that academic year.");
        result = { ok: true, student: { id: "LOCAL-" + Date.now(), name, className, year, score: 0, currentRound: 1, completedRounds: 0 } };
      }
      if (!result.ok) throw new Error(result.message || "Unable to register this participant.");
      const server = result.student || {};
      student = { id: server.id || student?.id || "LOCAL-" + Date.now(), name, className, year, registeredAt: server.registeredAt || new Date().toISOString(), score: Number(server.score || 0), currentRound: Number(server.currentRound || 1), completedRounds: Number(server.completedRounds || 0), timeTaken: Number(server.timeTaken || 0) };
      progress = freshProgress(); progress.round = currentRound(); save();
      setIdentity(); renderRounds(); renderQuestion(); renderResults(); await refreshLeaderboard(false);
      $("#registrationDialog").close(); switchView("dashboard");
    } catch (error) { $("#registrationMessage").textContent = error.message; }
    finally { button.disabled = false; button.textContent = "Continue to dashboard →"; }
  }

  async function startRound() {
    if (!registered()) { openRegistration(); return; }
    if (Number(student.completedRounds || 0) >= 3) { switchView("results"); return; }
    const round = currentRound();
    try {
      const result = await api("startRound", { studentId: student.id, round });
      if (result && !result.ok) throw new Error(result.message || "This round is not available.");
      if (result?.student) student = { ...student, ...result.student };
      const continuing = progress.round === round && progress.startedAt && progress.questions?.length && !progress.finished;
      if (!continuing) {
        progress = freshProgress(); progress.round = round; progress.baseScore = Number(student.score || 0); progress.startedAt = result?.startedAt ? new Date(result.startedAt).getTime() : Date.now();
        const remoteQuestions = await api("questions", { studentId: student.id, round });
        if (remoteQuestions && !remoteQuestions.ok) throw new Error(remoteQuestions.message || "Unable to load questions.");
        progress.questions = remoteQuestions?.rows?.length ? mergeQuestionData(remoteQuestions.rows) : localQuestions();
      }
      save(); setIdentity(); renderRounds(); renderQuestion(); switchView("game");
    } catch (error) { message("#answerFeedback", error.message, "wrong"); switchView("game"); }
  }

  async function checkAnswer() {
    const question = questions()[progress.questionIndex];
    const answer = clean($("#answerInput").value).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!question || !answer) { message("#answerFeedback", "Enter an answer before checking.", "wrong"); return; }
    const button = $("#submitAnswer");
    button.disabled = true; button.textContent = "Checking…";
    try {
      let result = await api("saveAnswer", { studentId: student.id, round: currentRound(), questionId: question.id, answer });
      if (!result) {
        const correct = answer === String(question.answer || "").toUpperCase();
        const previous = progress.answers[question.id];
        const added = correct && !previous?.correct ? Number(question.points || 10) : 0;
        progress.roundScore = Number(progress.roundScore || 0) + added;
        student.score = Number(progress.baseScore || 0) + progress.roundScore;
        result = { ok: true, correct, totalScore: student.score, roundScore: progress.roundScore, message: correct ? "Correct — " + added + " point" + (added === 1 ? "" : "s") + " added." : "Not quite. Check the clue and try again." };
      }
      if (!result.ok) throw new Error(result.message || "Unable to save your answer.");
      progress.answers[question.id] = { value: answer, correct: Boolean(result.correct) };
      if (Number.isFinite(Number(result.totalScore))) student.score = Number(result.totalScore);
      if (Number.isFinite(Number(result.roundScore))) progress.roundScore = Number(result.roundScore);
      const pointValue = Number(question.points || 10);
      message("#answerFeedback", result.message || (result.correct ? "Correct — " + pointValue + " point" + (pointValue === 1 ? "" : "s") + " added." : "Not quite. Check the clue and try again."), result.correct ? "correct" : "wrong");
      save(); setIdentity(); renderLeaderboard(); renderResults();
    } catch (error) { message("#answerFeedback", error.message, "wrong"); }
    finally { button.disabled = false; button.textContent = "Check answer"; }
  }

  async function finishRound(timedOut = false) {
    if (!registered() || progress.submitting) return;
    progress.submitting = true;
    const roundScore = Number(progress.roundScore || 0);
    const elapsed = Math.min(duration(), Math.floor((Date.now() - Number(progress.startedAt || Date.now())) / 1000));
    try {
      let result = await api("completeRound", { studentId: student.id, round: currentRound(), elapsed, timedOut });
      if (!result) {
        const qualified = roundScore >= roundPassMark(questions());
        result = { ok: true, qualified, completedRounds: qualified ? currentRound() : Number(student.completedRounds || 0), currentRound: qualified ? Math.min(3, currentRound() + 1) : currentRound(), score: student.score };
      }
      if (!result.ok) throw new Error(result.message || "Unable to submit this round.");
      student.score = Number(result.score ?? student.score);
      student.completedRounds = Number(result.completedRounds ?? student.completedRounds);
      student.currentRound = Number(result.currentRound ?? student.currentRound);
      student.timeTaken = Number(student.timeTaken || 0) + elapsed;
      progress.finished = true; progress.timeoutSubmitted = false; save();
      setIdentity(); renderRounds(); renderResults(); await refreshLeaderboard(false); switchView("results");
      if (!result.qualified) $("#resultStatus").textContent = "Not qualified — the pass mark was not reached.";
    } catch (error) { message("#answerFeedback", error.message, "wrong"); }
    finally { progress.submitting = false; save(); }
  }

  async function refreshLeaderboard(flash) {
    try {
      const result = await api("leaderboard", { year: student?.year || "" }, "GET");
      if (result?.ok) leaderboardRows = result.rows || [];
      renderLeaderboard(leaderboardRows);
      if (flash) $("#refreshLeaderboard").textContent = "Updated ✓";
    } catch { renderLeaderboard(); }
    finally { if (flash) setTimeout(() => { $("#refreshLeaderboard").textContent = "↻ Refresh"; }, 1200); }
  }

  async function unlockAdmin() {
    const code = clean($("#adminCode").value);
    if (!code) { message("#adminFeedback", "Enter the organizer access code.", "wrong"); return; }
    $("#unlockAdmin").disabled = true;
    try {
      let result = await api("admin", { command: "summary", code });
      if (!result) result = { ok: code === "BIO2026", summary: { registrations: registered() ? 1 : 0, active: registered() ? 1 : 0, questions: BioData.questions.length } };
      if (!result.ok) throw new Error(result.message || "That access code is not valid.");
      $("#adminLock").hidden = true; $("#adminPanel").hidden = false;
      $("#adminRegistrations").textContent = result.summary?.registrations ?? 0;
      $("#adminActive").textContent = result.summary?.active ?? 0;
      $("#adminQuestions").textContent = result.summary?.questions ?? BioData.questions.length;
      $("#adminNote").textContent = window.BIO_SHEETS_API_URL ? "Live data loaded from your Google Sheets backend." : "Demo mode: use BIO2026 to preview admin controls. Configure config.js to use the live Sheets backend.";
    } catch (error) { message("#adminFeedback", error.message, "wrong"); }
    finally { $("#unlockAdmin").disabled = false; }
  }

  async function adminAction(command) {
    try {
      const result = await api("admin", { command, code: clean($("#adminCode").value) });
      if (result && !result.ok) throw new Error(result.message || "The action could not be completed.");
      $("#adminNote").textContent = result?.message || (command === "refresh" ? "Dashboard data refreshed." : command === "open" ? "Next round opened." : command === "close" ? "Event paused." : "Registration export prepared.");
      if (command === "refresh") refreshLeaderboard(false);
    } catch (error) { $("#adminNote").textContent = error.message; }
  }

  function downloadCertificate() {
    if (Number(student?.completedRounds || 0) < 3) return;
    const text = "Bioinformatics Event 2026\\n\\nCertificate of Completion\\n\\nThis certifies that " + student.name + "\\ncompleted the " + student.year + " competition\\nwith " + student.score + " points.\\n";
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    link.download = "Bioinformatics-Event-2026-" + student.name.replace(/[^a-z0-9]/gi, "-") + ".txt";
    link.click(); URL.revokeObjectURL(link.href);
  }

  $$("[data-view]").forEach(button => button.addEventListener("click", () => button.dataset.view === "game" ? startRound() : switchView(button.dataset.view)));
  $("#mobileMenu").addEventListener("click", () => $(".sidebar").classList.toggle("open"));
  [$("#openRegistration"), $("#registerShortcut"), $("#changeParticipant"), $("#rulesStart")].forEach(button => button.addEventListener("click", openRegistration));
  $("#registrationForm").addEventListener("submit", register);
  $("#startRound").addEventListener("click", startRound);
  $("#nextRoundButton").addEventListener("click", startRound);
  $("#submitAnswer").addEventListener("click", checkAnswer);
  $("#answerInput").addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); checkAnswer(); } });
  $("#nextQuestion").addEventListener("click", () => { progress.questionIndex = Math.min(progress.questionIndex + 1, questions().length - 1); renderQuestion(); });
  $("#previousQuestion").addEventListener("click", () => { progress.questionIndex = Math.max(progress.questionIndex - 1, 0); renderQuestion(); });
  $("#crosswordClues").addEventListener("click", event => {
    const button = event.target.closest("[data-question-id]");
    if (!button) return;
    const list = questions();
    const index = list.findIndex(question => question.id === button.dataset.questionId);
    if (index >= 0) {
      progress.questionIndex = index;
      save();
      renderQuestion();
      $("#answerInput").focus();
    }
  });
  $("#finishRound").addEventListener("click", () => finishRound(false));
  $("#refreshLeaderboard").addEventListener("click", () => refreshLeaderboard(true));
  $("#showResults").addEventListener("click", () => switchView("results"));
  $("#unlockAdmin").addEventListener("click", unlockAdmin);
  $$("[data-admin-action]").forEach(button => button.addEventListener("click", () => adminAction(button.dataset.adminAction)));
  $("#certificateButton").addEventListener("click", downloadCertificate);
  window.addEventListener("beforeunload", save);

  (async () => {
    try { await syncFromServer(); } catch {}
    setIdentity(); renderRounds(); renderQuestion(); renderLeaderboard(); renderResults(); await refreshLeaderboard(false);
    setInterval(updateTimer, 1000);
  })();
})();
