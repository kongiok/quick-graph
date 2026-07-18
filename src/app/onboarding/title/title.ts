import { NgIcon, provideIcons } from '@ng-icons/core';
import { Component, output } from '@angular/core';
import {featherArrowRight, featherXSquare, featherCheckSquare} from "@ng-icons/feather-icons"
import { RouterLink } from '@angular/router';

@Component({
  selector: 'page-onboarding-title',
  imports: [NgIcon],
  templateUrl: './title.html',
  styleUrl: './title.scss',
  viewProviders: [provideIcons({featherArrowRight, featherXSquare, featherCheckSquare})]
})
export class Title {
  protected title = "圖卡生成器";
  protected intro = "為了保障你的個人隱私及使用體驗，我們會：";
  protected moveToNextStep = output<void>();
}
