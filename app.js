class Question {
    constructor(question, choices, correctAnswer) {
      this.question = question;
      this.choices = choices; // Array of all possible answers
      this.correctAnswer = correctAnswer;
    }
  
    checkAnswer(answer) {
      return answer === this.correctAnswer;
    }
}
  
class Quiz {
    constructor(questions) {
        this.questions = questions;
        this.currentIndex = 0;
        this.score = 0;
        this.currentDifficulty = 'easy'; // Start from 'easy' difficulty
    }

    getCurrentQuestion() {
        // Filter questions by current difficulty and get the next question
        const questionsByDifficulty = this.questions.filter(question => question.difficulty === this.currentDifficulty);
        return questionsByDifficulty[this.currentIndex % questionsByDifficulty.length];
    }

    submitAnswer(answer) {
        const currentQuestion = this.getCurrentQuestion();
        if (currentQuestion.checkAnswer(answer)) {
            this.score++;
            // Logic to increase difficulty if answer is correct
            if (this.currentDifficulty === 'easy') {
                this.currentDifficulty = 'medium';
            } else if (this.currentDifficulty === 'medium') {
                this.currentDifficulty = 'hard';
            }
        } else {
            // Optionally, decrease difficulty or keep the same
        }
        // Move to the next question index globally, not just within the current difficulty
        this.currentIndex++;
    }

    hasEnded() {
        // Assuming a fixed number of questions for the quiz to end
        return this.currentIndex >= this.questions.length;
    }
}

class User {
    constructor(username) {
      this.username = username;
      this.scores = []; // To keep track of scores from multiple quizzes
    }
  
    saveScore(score) {
      this.scores.push(score);
    }
  
    getScoreHistory() {
      return this.scores;
    }
}
  
  
async function fetchQuestions() {
    // Fetch the questions from an API or define them here
    const response = await fetch('https://opentdb.com/api.php?amount=10&type=multiple');
    const data = await response.json();
    return data.results;
  }
  
async function startQuiz() {
    const questions = await fetchQuestions();
    const quiz = new Quiz(questions);

    // Example function to display the current question to the user
    function displayCurrentQuestion() {
        const currentQuestion = quiz.getCurrentQuestion();
        // Update your UI here with the current question and answers
        console.log(currentQuestion.question); // For demonstration, replace with actual UI logic
    }

    // Example function to submit an answer and move to the next question
    function submitAnswer(answer) {
        quiz.submitAnswer(answer);
        if (!quiz.hasEnded()) {
        displayCurrentQuestion();
        } else {
        console.log(`Quiz ended! Your score: ${quiz.score}`);
        // Show the final score and maybe offer to restart the quiz
        }
    }

    // Initially display the first question
    displayCurrentQuestion();

    // Bind UI elements for answer submission to call submitAnswer()
    // This might involve adding event listeners to answer buttons or a form
}
  
// Call startQuiz to run the quiz
startQuiz();