import { PrepareVisitData } from '../api';

export enum Answers {
  Id = 'ID',
  PhoneNumber = 'PHONE_NUMBER',
  VisitType = 'VISIT_TYPE'
}

const QuestionsToAnswers: Record<number, Record<number, Answers>> = {
  199: {
    113: Answers.Id
  },
  200: {
    114: Answers.PhoneNumber,
  },
  201: {
    116: Answers.VisitType
  }
};


export class QuestionResolver {
  static isDone(question: PrepareVisitData): boolean {
    return !Boolean(question.QuestionnaireItem);
  }

  static resolveAnswer(question: PrepareVisitData): Answers {
    const { QuestionnaireItemId, QuestionId } = question.QuestionnaireItem;
    const maybeAnswer = QuestionsToAnswers[QuestionnaireItemId]?.[QuestionId];
    if (maybeAnswer) {
      return maybeAnswer;
    } else {
      throw new Error(`Could not find an answer in the map ${JSON.stringify(question)}`);
    }
  }


}
