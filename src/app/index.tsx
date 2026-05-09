import { InputField } from "@/components/ui/InputField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { FONTS } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext"; // <-- Import useAuth
import { useTheme } from "@/hooks/use-theme";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function GlobalLoginScreen() {
  const theme = useTheme();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      Alert.alert(
        "Login Failed",
        "Please check your credentials and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: theme.textMain }]}>
            Fest Food Manager
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Staff & Volunteer Access
          </Text>
        </View>

        {/* Form Section */}
        <InputField
          iconName="mail"
          placeholder="volunteer@fest.edu"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <InputField
          iconName="lock"
          placeholder="••••••••"
          isPassword
          value={password}
          onChangeText={setPassword}
        />

        <PrimaryButton
          title="Sign In"
          onPress={handleSignIn}
          isLoading={loading}
          disabled={loading || !email || !password}
        />

        {/* Footer Section */}
        <Text style={[styles.footerText, { color: theme.textMuted }]}>
          Need access?{" "}
          <Text style={[styles.footerLink, { color: theme.primary }]}>
            Contact the University CSE Dept.
          </Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 24,
  },
  title: {
    ...FONTS.header,
    marginBottom: 8,
  },
  subtitle: {
    ...FONTS.muted,
  },
  footerText: {
    ...FONTS.muted,
    textAlign: "center",
    marginTop: 32,
  },
  footerLink: {
    fontWeight: "600",
  },
});
