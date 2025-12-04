/**
 * Unit tests for Button component
 */

import { Colors, FontSizes } from "@/constants/theme";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Button } from "../button";

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: jest.fn().mockReturnValue("light"),
}));

describe("Button", () => {
  it("renders correctly with title", () => {
    const { getByText } = render(<Button title="Press Me" />);
    expect(getByText("Press Me")).toBeTruthy();
  });

  it("handles press events", () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Press Me" onPress={onPressMock} />
    );

    fireEvent.press(getByText("Press Me"));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  describe("Variants", () => {
    it("renders primary variant by default", () => {
      const { getByText } = render(<Button title="Primary" />);
      const text = getByText("Primary");
      // Primary text color is inverse (white)
      expect(text.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: Colors.light.textInverse }),
        ])
      );
    });

    it("renders secondary variant", () => {
      const { getByText } = render(
        <Button title="Secondary" variant="secondary" />
      );
      const text = getByText("Secondary");
      // Secondary text color is normal text color
      expect(text.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: Colors.light.text }),
        ])
      );
    });

    it("renders outline variant", () => {
      const { getByText } = render(
        <Button title="Outline" variant="outline" />
      );
      const text = getByText("Outline");
      // Outline text color is primary color
      expect(text.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: Colors.light.primary }),
        ])
      );
    });

    it("renders ghost variant", () => {
      const { getByText, getByTestId } = render(
        <Button title="Ghost" variant="ghost" testID="btn" />
      );
      const text = getByText("Ghost");
      const button = getByTestId("btn");

      // Ghost text color is primary color
      expect(text.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: Colors.light.primary }),
        ])
      );

      // Ghost background is transparent
      expect(button.props.style).toEqual(
        expect.objectContaining({ backgroundColor: "transparent" })
      );
    });

    it("renders danger variant", () => {
      const { getByText } = render(<Button title="Danger" variant="danger" />);
      const text = getByText("Danger");
      // Danger text color is inverse
      expect(text.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: Colors.light.textInverse }),
        ])
      );
    });

    it("renders default styling for invalid variant", () => {
      // Force an invalid variant to hit the default switch case
      const { getByText, getByTestId } = render(
        <Button title="Invalid" variant={"unknown" as any} testID="btn" />
      );
      const text = getByText("Invalid");
      const button = getByTestId("btn");

      // Should fall back to primary styles
      expect(text.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: Colors.light.textInverse }),
        ])
      );
      expect(button.props.style).toEqual(
        expect.objectContaining({ backgroundColor: Colors.light.primary })
      );
    });
  });

  describe("Sizes", () => {
    it("renders small text size", () => {
      const { getByText } = render(<Button title="Small" size="sm" />);
      const text = getByText("Small");
      expect(text.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ fontSize: FontSizes.sm }),
        ])
      );
    });

    it("renders large text size", () => {
      const { getByText } = render(<Button title="Large" size="lg" />);
      const text = getByText("Large");
      expect(text.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ fontSize: FontSizes.lg }),
        ])
      );
    });
  });

  describe("States", () => {
    it("shows loading indicator when loading is true", () => {
      const { getByTestId } = render(
        <Button title="Loading" loading testID="btn" />
      );
      // ActivityIndicator implies button is disabled
      const button = getByTestId("btn");
      expect(button.props.accessibilityState.disabled).toBe(true);
    });

    it("is disabled when disabled prop is true", () => {
      const onPressMock = jest.fn();
      const { getByText, getByTestId } = render(
        <Button title="Disabled" disabled onPress={onPressMock} testID="btn" />
      );

      fireEvent.press(getByText("Disabled"));
      expect(onPressMock).not.toHaveBeenCalled();

      // Check disabled background color
      const button = getByTestId("btn");
      expect(button.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: Colors.light.backgroundTertiary,
        })
      );
    });

    it("shows correct border color for disabled outline button", () => {
      const { getByTestId } = render(
        <Button
          title="Disabled Outline"
          variant="outline"
          disabled
          testID="btn"
        />
      );
      const button = getByTestId("btn");

      // Should use border color for disabled state
      expect(button.props.style).toEqual(
        expect.objectContaining({ borderColor: Colors.light.border })
      );
    });

    it("renders with full width when fullWidth is true", () => {
      const { getByTestId } = render(
        <Button title="Full Width" fullWidth testID="btn" />
      );
      const button = getByTestId("btn");

      expect(button.props.style).toEqual(
        expect.objectContaining({ width: "100%" })
      );
    });
  });
});
