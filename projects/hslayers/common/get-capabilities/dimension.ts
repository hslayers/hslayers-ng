import dayjs from 'dayjs';

//Move to common/dimensions
export class HsDimensionDescriptor {
  public type: string;
  public value: any;
  public modelValue: any;
  public label?: string;
  public values?: Array<any>;
  public format: string;
  public modelTimeValue: {hour: any; minute: any};

  //Original dimension object can be shared between multiple layers.
  constructor(
    public name: string,
    public originalDimension: any,
  ) {
    this.type = this.originalDimension.type;
    this.value = this.originalDimension.value ?? this.originalDimension.default;
    this.modelValue =
      this.originalDimension.value ?? this.originalDimension.default;
    // Duck-type check if the passed value is an instance of Date.
    if (typeof this.value?.getMonth == 'function') {
      if (this.type == 'datetime') {
        this.modelValue = {
          year: this.value.getFullYear(),
          month: this.value.getMonth() + 1,
          day: this.value.getDate(),
        };
        this.modelTimeValue = {
          hour: this.value.getHours(),
          minute: this.value.getMinutes(),
        };
      }
      if (this.type == 'date') {
        this.modelValue = {
          year: this.value.getFullYear(),
          month: this.value.getMonth() + 1,
          day: this.value.getDate(),
        };
      }
    }
    this.label = this.originalDimension.label;
    this.values = this.originalDimension.values;
    this.format = this.originalDimension.format;
  }

  /* This is needed because ng-bootstrap datepicker sets value to
    object {year:.., month: .., day: ..} but we need vanillaJs Date
    in dimension.value attribute instead. Use the complex value only
    for picker through modelValue */
  postProcessDimensionValue(): void {
    if (this.modelValue.year && this.modelValue.month) {
      this.originalDimension.value = new Date(
        this.modelValue.year,
        this.modelValue.month - 1,
        this.modelValue.day,
        this.modelTimeValue?.hour,
        this.modelTimeValue?.minute,
      );
    } else {
      this.originalDimension.value = this.modelValue;
    }
    if (['datetime', 'date'].includes(this.type) && this.format) {
      this.originalDimension.value = dayjs(this.originalDimension.value).format(
        this.format,
      );
    }
    this.value = this.originalDimension.value;
  }
}
