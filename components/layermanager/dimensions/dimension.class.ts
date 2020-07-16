export class HsDimensionDescriptor {
  public type: string;
  public value: any;
  public modelValue: any;
  public label?: string;
  public values?: Array<any>;

  constructor(public name: string, public originalDimension: any) {
    this.type = this.originalDimension.type;
    this.value = this.originalDimension.value;
    this.modelValue = this.originalDimension.value;
    this.label = this.originalDimension.label;
    this.values = this.originalDimension.values;
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
        this.modelValue.day
      );
    } else {
      this.originalDimension.value = this.modelValue;
    }
  }
}
