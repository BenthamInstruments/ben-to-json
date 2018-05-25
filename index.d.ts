//
// @file index.d.js
// @author David Hammond
// @author Richard Miller-Smith
// @date 1 May 2018
// @copyright Copyright © 2018 by Bentham Instruments Ltd. All Rights Reserved.
//

export function parse(ben_binary_data: string | Buffer): BenFile;

export interface BenFile {
  data_info: DataInfo;
  data_set: Array<DataSet>;
  file_info: Array<FileInfo>;
  graph: GraphInfo;
  markers: Array<MarkerInfo>;
  meta: Meta;
}

export interface CurveMeasurement {
  data: Array<[number, number, boolean]>;
  info: CurveMeasurementInfo;
}

export interface CurveMeasurementInfo {
  points: number;
  x_measurement: string;
  x_units: string;
  y_measurement: string;
  y_units: string;
}

export interface DataInfo {
  apply_data_calibration: boolean;
  apply_reference: boolean;
  auxiliary_type_and_units: string;
  auxiliary_type_and_units_code: string;
  certificate_file: string;
  data_calibration_file: string;
  date_and_time: string;
  file_time: string;
  post_scan_addon_description: string;
  post_scan_addon_filename: string;
  pre_scan_addon_description: string;
  pre_scan_addon_filename: string;
  reference_file: string;
  reference_parameter: string;
  reference_type: string;
  scan_summary: string;
  system_file: string;
  type_and_units: string;
  type_and_units_code: string;
}

export interface DataSet {
  add_on_measurements: Array<MeasurementInfo>;
  curve_measurements: Array<CurveMeasurement>;
  data: Array<[number, number]>;
  integrals: Array<MeasurementInfo>;
  name: string;
  no_of_points: number;
  no_of_points_to_plot: number;
  timestamps: Array<string>;
  zero_calibration: Array<ZeroCalibration>;
}

export interface FileInfo {
  information: string;
  title: string;
}

export interface GraphInfo {
  title: string;
  x_axis_title: string;
  y_axis_title: string;
}

export interface MarkerInfo {
  data_set_index: number;
  x_value: number;
  y_value: number;
}

export interface MeasurementInfo {
  measurement: string;
  uncertain: boolean;
  units: string;
  value: number;
}

export interface Meta {
  file_version: number;
  has_timestamps: boolean;
  stationary_wavelength: number;
  x_type: string;
}

export interface ZeroCalibration {
  adc_offset: number;
  dark_current: number;
  wavelength: number;
}
