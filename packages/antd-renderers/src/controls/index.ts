/*
  The MIT License
  
  Copyright (c) 2017-2019 EclipseSource Munich
  https://github.com/eclipsesource/jsonforms
  
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  
  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/
import AnyOfStringOrEnumControl, {
  anyOfStringOrEnumControlTester,
} from './AnyOfStringOrEnumControl';
import BooleanControl, { booleanControlTester } from './BooleanControl';
import BooleanToggleControl, {
  booleanToggleControlTester,
} from './BooleanToggleControl';
import DateControl, { dateControlTester } from './DateControl';
import DateTimeControl, { dateTimeControlTester } from './DateTimeControl';
import EnumControl, { enumControlTester } from './EnumControl';
import IntegerControl, { integerControlTester } from './IntegerControl';
import NativeControl, { nativeControlTester } from './NativeControl';
import NumberControl, { numberControlTester } from './NumberControl';
import OneOfEnumControl, { oneOfEnumControlTester } from './OneOfEnumControl';
import OneOfRadioGroupControl, {
  oneOfRadioGroupControlTester,
} from './OneOfRadioGroupControl';
import RadioGroupControl, {
  radioGroupControlTester,
} from './RadioGroupControl';
import SliderControl, { sliderControlTester } from './SliderControl';
import TextControl, { textControlTester } from './TextControl';
import TimeControl, { timeControlTester } from './TimeControl';
import FileControl, { fileControlTester } from './FileControl';

export {
  AnyOfStringOrEnumControl,
  anyOfStringOrEnumControlTester,
  BooleanControl,
  booleanControlTester,
  BooleanToggleControl,
  booleanToggleControlTester,
  DateControl,
  dateControlTester,
  DateTimeControl,
  dateTimeControlTester,
  EnumControl,
  enumControlTester,
  IntegerControl,
  integerControlTester,
  NativeControl,
  nativeControlTester,
  NumberControl,
  numberControlTester,
  OneOfEnumControl,
  oneOfEnumControlTester,
  OneOfRadioGroupControl,
  oneOfRadioGroupControlTester,
  RadioGroupControl,
  radioGroupControlTester,
  SliderControl,
  sliderControlTester,
  TextControl,
  textControlTester,
  TimeControl,
  timeControlTester,
  FileControl,
  fileControlTester,
};

export * from './InputControl';
