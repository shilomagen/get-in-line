import { HttpService } from './http';
import { User, UserVisit } from '../internal-types';
import { AnswerQuestionRequest, PrepareVisitData } from '../api';
import { Answers, QuestionResolver } from './question-resolver';

export class VisitPreparer {

  constructor(private readonly httpService: HttpService) {
  }

  private buildAnswerRequestFrame(question: PrepareVisitData): Omit<AnswerQuestionRequest, 'AnswerIds' | 'AnswerText'> {
    return {
      PreparedVisitToken: question.PreparedVisitToken,
      QuestionId: question.QuestionnaireItem.QuestionId,
      QuestionnaireItemId: question.QuestionnaireItem.QuestionnaireItemId

    };
  }

  private extractDataByAnswer(answer: Answers, user: User): string {
    switch (answer) {
      case Answers.Id:
        return user.id;
      case Answers.PhoneNumber:
        return user.phone;
    }
    return '';
  }

  private async answer(question: PrepareVisitData, user: User): Promise<PrepareVisitData> {
    if (QuestionResolver.isDone(question)) {
      console.log('Done with questions');
      return question;
    }
    const whatToAnswer = QuestionResolver.resolveAnswer(question);
    const request: AnswerQuestionRequest = {
      ...this.buildAnswerRequestFrame(question),
      ...(whatToAnswer === Answers.VisitType ? {
          AnswerIds: [77],
          AnswerText: null
        } :
        {
          AnswerIds: null,
          AnswerText: this.extractDataByAnswer(whatToAnswer, user)
        })
    };
    const nextQuestion = await this.httpService.answer(request);
    console.log(JSON.stringify(nextQuestion));
    return this.answer(nextQuestion, user);
  }

  async prepare(user: User, serviceId: number): Promise<UserVisit> {
    const initialQuestion = await this.httpService.prepareVisit(serviceId);
    console.log(JSON.stringify(initialQuestion));
    const visitData = await this.answer(initialQuestion, user);

    return {
      ...user,
      visitId: visitData.PreparedVisitId,
      visitToken: visitData.PreparedVisitToken
    };


  }
}
