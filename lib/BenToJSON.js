//
// @file BenToJSON.js
// @author David Hammond
// @author Richard Miller-Smith
// @date 1 May 2018
// @copyright Copyright © 2018 by Bentham Instruments Ltd. All Rights Reserved.
//

'use strict';

const OleReader = require('./OleReader');

// A parser class to convert a .ben file to JSON
class BenToJSON {
  static get GUID() {
    return Buffer.from([
      0x4e, 0xd0, 0xdf, 0x71,
      0x88, 0xcb,
      0x02, 0x45,
      0x88, 0xeb,
      0xd9, 0x43, 0xa3, 0x09, 0x1a, 0x1a
    ]);
  }

  constructor(data) {
    this.ole = new OleReader(data);

    // The converted .ben file
    this.json = {};

    // parse and convert the .ben file
    this.parse();
  }

  get_json() {
    return this.json;
  }

  version_ge(version) {
    return this.json.meta.file_version >= version;
  }

  parse() {
    if (!this.ole.find_guid(BenToJSON.GUID)) {
      throw new Error("The Bentham GUID is not found in the file");
    }

    if (!this.ole.check_length()) {
      throw new Error("The file is not the correct length");
    }

    const file_version = this.ole.read_uint32();

    if (this.ole.read_bool() != 0) {
      throw new Error("Unsupported file format (the file contains no spectral data)");
    }

    this.json.meta = {
      file_version: file_version
    };

    if (this.version_ge(3)) {
      this.json.meta.has_timestamps = this.ole.read_bool();
    } else {
      this.json.meta.has_timestamps = false;
    }

    if (this.version_ge(4)) {
      // not exposed via BenFileCom.h
      //this.json.meta.spectrum_names_edited = this.ole.read_bool();
      const spectrum_names_edited = this.ole.read_bool();
    } else {
      //this.json.meta.spectrum_names_edited = true;
    }

    this.read_graphview();
    this.read_data_sets();
    this.skip_annotations();
    this.skip_arrows();
    this.read_timestamps();
    this.read_data_info();
    this.read_x_type();
    this.read_stationary_wavelength();
    this.read_file_info();
    this.skip_relay_measurements();
    this.read_zero_calibration_information();
    this.read_spectral_markers();
    this.read_measurement_info_set("integrals");
    this.read_measurement_info_set("add_on_measurements");
    this.read_curve_measurements();
  }

  read_graphview() {
    this.json.graph = {};

    this.gv_version = this.ole.read_double(true);
    if (Number.isNaN(this.gv_version)) {
      this.gv_version = this.ole.read_uint32();
      this.ole.skip_double();
    } else {
      this.gv_version = 1;
    }
    this.ole.skip_double(3);

    // Custom 
    if (this.gv_version >= 4) {
      this.ole.skip_uint32(2);
      let tmp = this.ole.read_uint32();
      if (tmp == 0 || tmp == 1) {
        this.ole.skip_double(4);
        this.ole.skip_uint32(2);
      }
    }

    // Whole plot settings
    this.ole.skip_colorref();

    // Label settings
    this.ole.skip_double();
    this.ole.skip_string();
    this.ole.skip_colorref();
    this.ole.skip_uint32(2);

    // Grid line settings
    this.ole.skip_colorref(2);
    this.ole.skip_uint32(8);

    // Title settings
    this.ole.skip_double();
    this.ole.skip_string();
    this.ole.skip_colorref();
    this.ole.skip_uint32(3);
    this.add_string(this.json.graph, "title");

    // Axis title settings
    this.ole.skip_double();
    this.ole.skip_string();
    this.ole.skip_colorref();
    this.ole.skip_uint32(3);
    this.add_string(this.json.graph, "x_axis_title");
    this.ole.skip_uint32();
    this.add_string(this.json.graph, "y_axis_title");

    // Axis settings
    this.ole.skip_double(4);
    this.ole.skip_colorref();
    this.ole.skip_uint32(8);

    // Data settings
    let count = this.ole.read_uint32();
    this.ole.skip_double(count);
    this.ole.skip_colorref(2 * count);
    this.ole.skip_uint32(6 * count);

    // Key settings
    if (this.gv_version >= 3) {
      this.ole.skip_double();
      this.ole.skip_uint32(3);
      this.ole.skip_string();
      this.ole.skip_colorref();
      this.ole.skip_uint32(2);

      this.ole.skip_double(4);
      this.ole.skip_uint32(9);
    } else if (this.gv_version >= 5) {
      // TODO: Is this a bug in the original C++ code?
      // If version is >= 5 then test above will also be true
      this.ole.skip_uint32();
    }
  }

  read_data_sets() {
    this.json.data_set = [];

    this.ole.skip_string();
    let num_data_sets = this.ole.read_uint32();
    this.ole.skip_uint32();
    this.ole.skip_double(2);
    this.ole.skip_uint32(10);

    for (let i = 0; i < num_data_sets; ++i) {
      let ds = {};
      ds.no_of_points = this.ole.read_uint32();
      ds.no_of_points_to_plot = this.ole.read_uint32();
      this.add_string(ds, "name");
      ds.add_on_measurements = [];
      ds.curve_measurements = [];
      ds.data = [];
      ds.integrals = [];
      ds.timestamps = [];
      ds.zero_calibration = [];
      this.json.data_set.push(ds);
    }

    for (let i = 0; i < num_data_sets; ++i) {
      this.read_dataset_data(this.json.data_set[i]);
    }
  }

  read_dataset_data(ds) {
    for (let i = 0; i < ds.no_of_points; ++i) {
      let x = this.ole.read_double();
      let y = this.ole.read_double();
      ds.data[i] = [x, y];
    }
  }

  skip_annotations() {
    if (this.gv_version >= 2) {
      let num_annotations = this.ole.read_uint32();
      for (let i = 0; i < num_annotations; ++i) {
        let tmp = this.ole.read_uint32();
        if (tmp == 999)
          this.ole.skip_uint32(2);

        this.ole.skip_double(3);
        this.ole.skip_uint32(15);
        this.ole.skip_colorref();
        this.ole.skip_string();

        let lines = this.ole.read_uint32();

        for (let j = 0; j < lines; ++j) {
          let segments = this.ole.read_uint32();
          for (let k = 0; k < segments; ++k) {
            this.ole.skip_uint32();
            this.ole.skip_string();
          }
        }
      }
    }
  }

  skip_arrows() {
    if (this.gv_version >= 3) {
      let num_arrows = this.ole.read_uint32();
      this.ole.skip(num_arrows * 4 * 15);
      let num_curved_arrows = this.ole.read_uint32();
      // //Curved arrows
      // ar >> Count;
      // for (int i=0; i<Count; i++)
      //    ar.Read(Buffer, 8*sizeof(double) + 6*sizeof(int) + sizeof(COLORREF) + sizeof(CRect));
      this.ole.skip(num_curved_arrows * 108); // 108 = (8*8 + 6*4 + 4 + 16)
    }
  }

  read_timestamps() {
    if (this.version_ge(3) && this.json.meta.has_timestamps) {
      this.json.data_set.forEach(ds => {
        ds.timestamps = [];
        for (let i = 0; i < ds.no_of_points; ++i) {
          ds.timestamps.push(this.ole.read_systemtime());
        }
      });
    }
  }

  /*
    ar >> m_sDateAndTime;
    ar >> m_sScanSummary;
    ar >> m_bApplyDataCal;
    ar >> m_sDataCalFile;
    ar >> m_sCertificateFile;
    ar >> m_sSystemFile;
    ar >> m_sPreScanDesc;
    ar >> m_sPostScanDesc;
    ar >> m_sPreScanFile;
    ar >> m_sPostScanFile;
    ar >> m_sTypeAndUnits;
    ar >> m_sTypeAndUnitsCode;
    ar >> m_sAuxiliaryTypeAndUnits;
    ar >> m_sAuxiliaryTypeAndUnitsCode;
    ar >> m_bApplyReference;
    ar >> m_sReferenceType;
    ar >> m_sReferenceFile;
    ar >> m_sReferenceParameter;
    ar.Read(&m_FileTime, sizeof(SYSTEMTIME));
  */
  read_data_info() {
    this.json.data_info = {};
    this.add_string(this.json.data_info, "date_and_time");
    this.add_string(this.json.data_info, "scan_summary")
    this.json.data_info.apply_data_calibration = this.ole.read_bool();
    this.add_string(this.json.data_info, "data_calibration_file");
    this.add_string(this.json.data_info, "certificate_file");
    this.add_string(this.json.data_info, "system_file");
    this.add_string(this.json.data_info, "pre_scan_addon_description");
    this.add_string(this.json.data_info, "post_scan_addon_description");
    this.add_string(this.json.data_info, "pre_scan_addon_filename");
    this.add_string(this.json.data_info, "post_scan_addon_filename");
    this.add_string(this.json.data_info, "type_and_units");
    this.add_string(this.json.data_info, "type_and_units_code");
    this.add_string(this.json.data_info, "auxiliary_type_and_units");
    this.add_string(this.json.data_info, "auxiliary_type_and_units_code");
    this.json.data_info.apply_reference = this.ole.read_bool();
    this.add_string(this.json.data_info, "reference_type");
    this.add_string(this.json.data_info, "reference_file");
    this.add_string(this.json.data_info, "reference_parameter");
    this.json.data_info.file_time = this.ole.read_systemtime();

   // Read and discard measurement units and types; 
   // these are in the data info as well
   // ar.Read(Buffer, 4*sizeof(int));
   this.ole.skip_uint32(4);

   // Right axis settings
   // ar >> TempInt;
   // ar.Read(Buffer, m_nNoOfDataSets*sizeof(int));    
   this.ole.skip_uint32();
   this.ole.skip_uint32(this.json.data_set.length);
  }

  read_x_type() {
    const x_types = [ 
      "Wavelength / nm" ,
      "Time / s", 
      "Time / ms",
      "Arbitrary units",
      "Wavelength / µm"
    ];    
    const x_type = this.ole.read_uint32();
    if (x_type >=0 && x_type <= 4) {
      this.json.meta.x_type = x_types[x_type];
    } else {
      throw new Error("invalid x_type encoding");
    }
  }

  read_stationary_wavelength() {
    if (!/^Wavelength/.test(this.json.meta.x_type)) {
      this.json.meta.stationary_wavelength = this.ole.read_double();
    }
  }

  read_file_info() {
    this.json.file_info = [];
    const file_info_count = this.ole.read_uint32();
    for (let i = 0; i < file_info_count; ++i) {
      let file_info = {};
      this.add_string(file_info, "title");
      this.add_string(file_info, "information");
      this.json.file_info.push(file_info);
    }
  }

  skip_relay_measurements() {
    // ar >> m_nNoOfRelayMeasurements;
    // if (m_nNoOfRelayMeasurements > 0)
    // {
    //    m_pRelayMeasurement = new RelayMeasurementStruct[m_nNoOfRelayMeasurements];
    //    for (int i=0; i<m_nNoOfRelayMeasurements; i++)
    //       m_pRelayMeasurement[i].Serialize(ar);
    // }    
    const no_of_relay_measurements = this.ole.read_uint32();
    for (let i = 0; i < no_of_relay_measurements; ++i) {
      this.ole.skip_double(); // m_dValue
      this.ole.skip_string(); // m_sMeasurement
      this.ole.skip_string(); // m_sUnits
    }
  }

  read_zero_calibration_information() {
    // for (int i = 0; i < m_nNoOfDataSets; i++)
    //   m_pZeroCalibrationInfo[i].Serialize(ar);
    this.json.data_set.forEach(d => {
      d.zero_calibration = [];
      // ar >> m_nNoOfValues;
      // if (m_nNoOfValues > 0)
      // {
      //    SetNoOfValues(m_nNoOfValues);
      //    ar.Read(m_pdWavelength, m_nNoOfValues*sizeof(double));
      //    ar.Read(m_pdDarkCurrent, m_nNoOfValues*sizeof(double));
      //    ar.Read(m_pnADCOffset, m_nNoOfValues*sizeof(int));
      // }
      // else m_nNoOfValues = 0;
      const no_of_values = this.ole.read_uint32();
      if (no_of_values > 0) {
        const wavelength = this.ole.read_double_array(no_of_values);
        const dark_current = this.ole.read_double_array(no_of_values);
        const adc_offset = this.ole.read_uint32_array(no_of_values);
        for (let i = 0; i < no_of_values; i++) {
          d.zero_calibration.push({
            adc_offset: adc_offset[i],
            dark_current: dark_current[i],
            wavelength: wavelength[i]
          });
        }
      }
    });
  }

  read_spectral_markers() {
    // ar >> m_nNoOfMarkers;
    // if (m_nNoOfMarkers > 0)
    // {
    //    m_pMarkerInfo = new MarkerInfo[m_nNoOfMarkers];
    //    for (int i=0; i<m_nNoOfMarkers; i++)
    //    {
    //       m_pMarkerInfo[i].Serialize(ar);
    //       ar.Read(Buffer, sizeof(int));
    //    }
    // }
    this.json.markers= [];
    const no_of_values = this.ole.read_uint32();
    for (let i = 0; i < no_of_values; ++i) {
      const marker = { };
      marker.data_set_index = this.ole.read_uint32();
      marker.x_value = this.ole.read_double(true);
      marker.y_value = this.ole.read_double(true);
      this.json.markers.push(marker);
      this.ole.skip_uint32();
    }
  }

  read_measurement_info_set(key) {
    // ar >> Count;
    // m_Integrals.resize(Count);
    // if (Count > 0)
    // {
    //    for (int i=0; i<Count; i++)
    //    {
    //       int Count2 = 0;
    //       ar >> Count2;
    //       for (int j=0; j<Count2; j++)
    //       {
    //          MeasurementStruct Measurement;
    //          Measurement.Serialize(ar);
    //          m_Integrals[i].push_back(Measurement);
    //       }
    //    }
    // }
    const count = this.ole.read_uint32();
    if (count > 0) {
      for (let i = 0; i < count; ++i) {
        const measurement_info_set = [];
        const count2 = this.ole.read_uint32();
        for (let j = 0; j < count2; ++j) {
          const measurement_info = {};
          measurement_info.value = this.ole.read_double();
          this.add_string(measurement_info, "measurement");
          this.add_string(measurement_info, "units");
          measurement_info.uncertain = this.ole.read_bool();
          measurement_info_set.push(measurement_info);
        }
        if (i < this.json.data_set.length) {
          this.json.data_set[i][key] = measurement_info_set;
        }
      }
    }
  }

  read_curve_measurements() {
    // ar >> Count;
    // m_CurveMeasurements.resize(Count);
    // if (Count > 0)
    // {
    //    for (int i=0; i<Count; i++)
    //    {
    //       int Count2 = 0;
    //    ar >> Count2;
    //       for (int j=0; j<Count2; j++)
    //       {
    //          CurveMeasurementStruct Measurement;
    //          Measurement.Serialize(ar);
    //          m_CurveMeasurements[i].push_back(Measurement);
    //       }
    //    }
    // }
    const count = this.ole.read_uint32();
    if (count > 0) {
      for (let i = 0; i < count; ++i) {
        const measurement_set = [];
        const count2 = this.ole.read_uint32();
        for (let j = 0; j < count2; ++j) {          
          const no_of_points = this.ole.read_uint32();
          const x_value = this.ole.read_double_array(no_of_points);
          const y_value = this.ole.read_double_array(no_of_points);
          const uncertain = this.ole.read_bool_array(no_of_points);

          const info = {};
          info.points = no_of_points;
          this.add_string(info, "x_measurement");
          this.add_string(info, "x_units");
          this.add_string(info, "y_measurement");
          this.add_string(info, "y_units");

          const measurement = {
            data: [],
            info: info
          };

          for (let p = 0; p < no_of_points; ++p) {
            measurement.data.push([ x_value[p], y_value[p], uncertain[p] ]);
          }

          measurement_set.push(measurement);
        }

        if (i < this.json.data_set.length) {
          this.json.data_set[i].curve_measurements = measurement_set;
        }
      }
    }
  }

  add_string(obj, key) {
    const str = this.ole.read_utf8_string().trimRight();
    if (str) {
      obj[key] = str;
    }
  }
}

module.exports = BenToJSON;
