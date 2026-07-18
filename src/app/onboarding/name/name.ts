import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as v from 'valibot';
import { ProfileName } from '../../types/common.type';

@Component({
  selector: 'page-onboarding-name',
  imports: [FormsModule],
  templateUrl: './name.html',
  styleUrl: './name.scss',
})
export class Name {
  protected title = "我們怎麼稱呼你？";
  protected draftName = signal("");
  protected submitName = output<string>();

  protected onInput(value: string): void {
    this.draftName.set(value);
    this.title = `Hi ${this.draftName()}！`
    }
  protected onSubmit(): void {
    const result = v.safeParse(ProfileName, this.draftName());

    if (!result.success) {
      this.draftName.set("");
      this.title = "我們怎麼稱呼你？";
      return;
    }
    this.submitName.emit(result.output);
  }
}
