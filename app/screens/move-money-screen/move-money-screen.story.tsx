import { storiesOf } from "@storybook/react-native";
import * as React from "react";
import { Story, StoryScreen, UseCase } from "../../../storybook/views";
import { MoveMoneyScreen } from "./money-money-screen";
import { boolean, withKnobs } from "@storybook/addon-knobs";
import { action } from '@storybook/addon-actions';
import { Button } from "react-native-elements";


declare let module

storiesOf("MoveMoney Screen", module)
  .addDecorator(withKnobs)
  .addDecorator((fn) => <StoryScreen>{fn()}</StoryScreen>)
  .add("Style Presets", () => (
    <Story>
      <UseCase text="Dollar" usage="The primary.">
        <MoveMoneyScreen 
          bankOnboarded={boolean('bankOnboarded', false)}
          navigation={{navigate: action('navigate')}}
          walletOnboarded={boolean('walletOnboarded', false)}
          amount={12345} 
        />
      </UseCase>
    </Story>
  ))
