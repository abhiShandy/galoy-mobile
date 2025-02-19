import { palette } from "@app/theme"
import React, { useEffect } from "react"
import LottieView from "lottie-react-native"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import successLottieJson from "./success_lottie.json"
import useMainQuery from "@app/hooks/use-main-query"
import { StackScreenProps } from "@react-navigation/stack"
import { RootStackParamList } from "@app/navigation/stack-param-lists"
import { useI18nContext } from "@app/i18n/i18n-react"
import { testProps } from "../../../utils/testProps"

const styles = StyleSheet.create({
  scrollView: {
    flexDirection: "column",
    padding: 20,
    flex: 6,
  },
  contentContainer: {
    flexGrow: 1,
  },
  lottie: {
    height: 100,
    width: 100,
  },
  successLottieText: {
    color: palette.darkGrey,
    fontSize: 18,
    textAlign: "center",
  },
  lottieContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
})

const SendBitcoinSuccessScreen = ({
  navigation,
}: StackScreenProps<RootStackParamList, "sendBitcoinSuccess">) => {
  const { refetch } = useMainQuery()
  const { LL } = useI18nContext()
  const CALLBACK_DELAY = 2000
  useEffect(() => {
    refetch()
    const navigateToHomeTimeout = setTimeout(() => navigation.popToTop(), CALLBACK_DELAY)
    return () => clearTimeout(navigateToHomeTimeout)
  }, [navigation, refetch])

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.lottieContainer}>
        <LottieView
          source={successLottieJson}
          loop={false}
          autoPlay
          style={styles.lottie}
          resizeMode="cover"
        />
        <Text
          {...testProps(LL.SendBitcoinScreen.success())}
          style={styles.successLottieText}
        >
          {LL.SendBitcoinScreen.success()}
        </Text>
      </View>
    </ScrollView>
  )
}

export default SendBitcoinSuccessScreen
