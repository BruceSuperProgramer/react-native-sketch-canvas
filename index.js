import React from "react";
import PropTypes from "prop-types";
import ReactNative, {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ViewPropTypes,
  Dimensions
} from "react-native";
import SketchCanvas from "./src/SketchCanvas";
import { requestPermissions } from "./src/handlePermissions";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const COMPONENT_NAME = {
  ERASER: "ERASER",
  PENCIL: "PENCIL",
  BRUSH: "BRUSH",
  UNDO: "UNDO",
  BIN: "BIN"
};
export default class RNSketchCanvas extends React.Component {
  static propTypes = {
    containerStyle: ViewPropTypes.style,
    canvasStyle: ViewPropTypes.style,
    onStrokeStart: PropTypes.func,
    onStrokeChanged: PropTypes.func,
    onStrokeEnd: PropTypes.func,
    onClosePressed: PropTypes.func,
    onUndoPressed: PropTypes.func,
    onClearPressed: PropTypes.func,
    onPathsChange: PropTypes.func,
    user: PropTypes.string,

    closeComponent: PropTypes.node,
    eraseComponent: PropTypes.node,
    undoComponent: PropTypes.node,
    clearComponent: PropTypes.node,
    saveComponent: PropTypes.node,
    strokeComponent: PropTypes.func,
    strokeSelectedComponent: PropTypes.func,
    strokeWidthComponent: PropTypes.func,

    strokeColors: PropTypes.arrayOf(
      PropTypes.shape({ color: PropTypes.string })
    ),
    defaultStrokeIndex: PropTypes.number,
    defaultStrokeWidth: PropTypes.number,

    minStrokeWidth: PropTypes.number,
    maxStrokeWidth: PropTypes.number,
    strokeWidthStep: PropTypes.number,

    savePreference: PropTypes.func,
    onSketchSaved: PropTypes.func,

    text: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.string,
        font: PropTypes.string,
        fontSize: PropTypes.number,
        fontColor: PropTypes.string,
        overlay: PropTypes.oneOf(["TextOnSketch", "SketchOnText"]),
        anchor: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }),
        position: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }),
        coordinate: PropTypes.oneOf(["Absolute", "Ratio"]),
        alignment: PropTypes.oneOf(["Left", "Center", "Right"]),
        lineHeightMultiple: PropTypes.number
      })
    ),
    localSourceImage: PropTypes.shape({
      filename: PropTypes.string,
      directory: PropTypes.string,
      mode: PropTypes.string
    }),

    permissionDialogTitle: PropTypes.string,
    permissionDialogMessage: PropTypes.string
  };

  static defaultProps = {
    containerStyle: null,
    canvasStyle: null,
    onStrokeStart: () => {},
    onStrokeChanged: () => {},
    onStrokeEnd: () => {},
    onClosePressed: () => {},
    onUndoPressed: () => {},
    onClearPressed: () => {},
    onPathsChange: () => {},
    user: null,

    closeComponent: null,
    eraseComponent: null,
    undoComponent: null,
    clearComponent: null,
    saveComponent: null,
    strokeComponent: null,
    strokeSelectedComponent: null,
    strokeWidthComponent: null,

    strokeColors: [
      { color: "rgba(0,0,0,1)" },
      { color: "rgba(239,89,82,1)" },
      { color: "rgba(255,211,39,1)" },
      { color: "rgba(154,230,0,1)" },
      { color: "rgba(80,213,245,1)" },
      { color: "rgba(85,162,248,1)" },
      { color: "rgba(162,108,250,1)" }
    ],
    alphlaValues: ["33", "77", "AA", "FF"],
    defaultStrokeIndex: 0,
    defaultStrokeWidth: 3,

    minStrokeWidth: 3,
    maxStrokeWidth: 15,
    strokeWidthStep: 3,

    savePreference: null,
    onSketchSaved: () => {},

    text: null,
    localSourceImage: null,

    permissionDialogTitle: "",
    permissionDialogMessage: ""
  };

  constructor(props) {
    super(props);

    this.state = {
      color: props.strokeColors[props.defaultStrokeIndex].color,
      strokeWidth: props.defaultStrokeWidth,
      alpha: "FF",
      nameOfComponentSelected: COMPONENT_NAME.PENCIL
    };

    this._colorChanged = false;
    this._strokeWidthStep = props.strokeWidthStep;
    this._alphaStep = -1;
  }

  clear() {
    this._sketchCanvas.clear();
  }

  undo() {
    return this._sketchCanvas.undo();
  }

  addPath(data) {
    this._sketchCanvas.addPath(data);
  }

  deletePath(id) {
    this._sketchCanvas.deletePath(id);
  }

  save() {
    if (this.props.savePreference) {
      const p = this.props.savePreference();
      this._sketchCanvas.save(
        p.imageType,
        p.transparent,
        p.folder ? p.folder : "",
        p.filename,
        p.includeImage !== false,
        p.includeText !== false,
        p.cropToImageSize || false
      );
    } else {
      const date = new Date();
      this._sketchCanvas.save(
        "png",
        false,
        "",
        date.getFullYear() +
          "-" +
          (date.getMonth() + 1) +
          "-" +
          ("0" + date.getDate()).slice(-2) +
          " " +
          ("0" + date.getHours()).slice(-2) +
          "-" +
          ("0" + date.getMinutes()).slice(-2) +
          "-" +
          ("0" + date.getSeconds()).slice(-2),
        true,
        true,
        false
      );
    }
  }

  nextStrokeWidth() {
    if (
      (this.state.strokeWidth >= this.props.maxStrokeWidth &&
        this._strokeWidthStep > 0) ||
      (this.state.strokeWidth <= this.props.minStrokeWidth &&
        this._strokeWidthStep < 0)
    ) {
      this._strokeWidthStep = -this._strokeWidthStep;
    }
    this.setState({
      strokeWidth: this.state.strokeWidth + this._strokeWidthStep
    });
  }

  onSelectedColorLayout = (e) => {
    const { layout } = e.nativeEvent;

    console.log("x:", layout.x);
    console.log("y:", layout.y);
  };

  _renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={{ alignSelf: "center" }}
      onPress={() => {
        if (this.state.color === item.color) {
          const index = this.props.alphlaValues.indexOf(this.state.alpha);
          if (this._alphaStep < 0) {
            this._alphaStep = index === 0 ? 1 : -1;
            this.setState({
              alpha: this.props.alphlaValues[index + this._alphaStep]
            });
          } else {
            this._alphaStep =
              index === this.props.alphlaValues.length - 1 ? -1 : 1;
            this.setState({
              alpha: this.props.alphlaValues[index + this._alphaStep]
            });
          }
        } else {
          this.setState({ color: item.color });
          this._colorChanged = true;
        }
      }}
    >
      {this.state.color !== item.color &&
        this.props.strokeComponent &&
        this.props.strokeComponent(item.color, index)}
      {this.state.color === item.color &&
        this.props.strokeSelectedComponent &&
        this.props.strokeSelectedComponent(
          item.color + this.state.alpha,
          index,
          this._colorChanged
        )}
    </TouchableOpacity>
  );

  componentDidUpdate() {
    this._colorChanged = false;
  }

  async componentDidMount() {
    const isStoragePermissionAuthorized = await requestPermissions(
      this.props.permissionDialogTitle,
      this.props.permissionDialogMessage
    );
  }

  render() {
    const { nameOfComponentSelected } = this.state;
    return (
      <View style={this.props.containerStyle}>
        <SketchCanvas
          ref={(ref) => (this._sketchCanvas = ref)}
          style={this.props.canvasStyle}
          strokeColor={
            this.state.color +
            (this.state.color.length === 9 ? "" : this.state.alpha)
          }
          onStrokeStart={this.props.onStrokeStart}
          onStrokeChanged={this.props.onStrokeChanged}
          onStrokeEnd={this.props.onStrokeEnd}
          user={this.props.user}
          strokeWidth={this.state.strokeWidth}
          onSketchSaved={(success, path) =>
            this.props.onSketchSaved(success, path)
          }
          onPathsChange={this.props.onPathsChange}
          text={this.props.text}
          localSourceImage={this.props.localSourceImage}
          permissionDialogTitle={this.props.permissionDialogTitle}
          permissionDialogMessage={this.props.permissionDialogMessage}
        />
        <View
          style={{
            backgroundColor: "rgba(53, 47, 73, 1)",
            width: screenWidth,
            height: "25%",
            justifyContent: "space-around",
            alignItems: "center"
          }}
        >
          <View
            style={{
              flexDirection: "row",
              width: "90%",
              borderRadius: 50,
              justifyContent: "center"
            }}
          >
            {this.props.strokeColors.map((item, index) => {
              return this._renderItem({ item, index });
            })}
          </View>
          <View style={{ flexDirection: "row", height: "30%" }}>
            <View
              style={{
                flexDirection: "row"
              }}
            >
              {this.props.closeComponent && (
                <TouchableOpacity
                  onPress={() => {
                    this.props.onClosePressed();
                  }}
                >
                  {this.props.closeComponent}
                </TouchableOpacity>
              )}
            </View>
            <View
              style={{
                width: "85%",
                flexDirection: "row",
                justifyContent: "space-between"
              }}
            >
              {this.props.strokePencilWidthComponent && (
                <TouchableOpacity
                  style={{
                    transform: [
                      {
                        scale:
                          nameOfComponentSelected == COMPONENT_NAME.PENCIL
                            ? 1.5
                            : 1
                      }
                    ]
                  }}
                  onPress={() => {
                    this.setState({
                      strokeWidth: 5,
                      nameOfComponentSelected: COMPONENT_NAME.PENCIL
                    });
                  }}
                >
                  {this.props.strokePencilWidthComponent()}
                </TouchableOpacity>
              )}

              {this.props.strokeBrushWidthComponent && (
                <TouchableOpacity
                  style={{
                    transform: [
                      {
                        scale:
                          nameOfComponentSelected == COMPONENT_NAME.BRUSH
                            ? 1.5
                            : 1
                      }
                    ]
                  }}
                  onPress={() => {
                    this.setState({
                      strokeWidth: 10,
                      nameOfComponentSelected: COMPONENT_NAME.BRUSH
                    });
                  }}
                >
                  {this.props.strokeBrushWidthComponent()}
                </TouchableOpacity>
              )}

              {this.props.undoComponent && (
                <TouchableOpacity
                  style={{
                    transform: [
                      {
                        scale:
                          nameOfComponentSelected == COMPONENT_NAME.UNDO
                            ? 1.5
                            : 1
                      }
                    ]
                  }}
                  onPress={() => {
                    this.props.onUndoPressed(this.undo());
                    this.setState({
                      nameOfComponentSelected: COMPONENT_NAME.UNDO
                    });
                  }}
                >
                  {this.props.undoComponent}
                </TouchableOpacity>
              )}

              {this.props.eraseComponent && (
                <TouchableOpacity
                  style={{
                    transform: [
                      {
                        scale:
                          nameOfComponentSelected == COMPONENT_NAME.ERASER
                            ? 1.5
                            : 1
                      }
                    ]
                  }}
                  onPress={() => {
                    this.setState({
                      color: "#00000000",
                      nameOfComponentSelected: COMPONENT_NAME.ERASER
                    });
                  }}
                >
                  {this.props.eraseComponent}
                </TouchableOpacity>
              )}

              {this.props.clearComponent && (
                <TouchableOpacity
                  style={{
                    transform: [
                      {
                        scale:
                          nameOfComponentSelected == COMPONENT_NAME.BIN
                            ? 1.5
                            : 1
                      }
                    ]
                  }}
                  onPress={() => {
                    this.clear();
                    this.props.onClearPressed();
                    this.setState({
                      nameOfComponentSelected: COMPONENT_NAME.BIN
                    });
                  }}
                >
                  {this.props.clearComponent}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  }
}

RNSketchCanvas.MAIN_BUNDLE = SketchCanvas.MAIN_BUNDLE;
RNSketchCanvas.DOCUMENT = SketchCanvas.DOCUMENT;
RNSketchCanvas.LIBRARY = SketchCanvas.LIBRARY;
RNSketchCanvas.CACHES = SketchCanvas.CACHES;

export { SketchCanvas };
