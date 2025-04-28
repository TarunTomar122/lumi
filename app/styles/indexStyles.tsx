import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DAD9DE',
    paddingTop: 60,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    padding: 32,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    width: '100%',
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingText: {
    fontSize: 20,
    fontFamily: 'MonaSans-Regular',
  },
  headerText: {
    fontSize: 18,
    fontFamily: 'MonaSans-SemiBold',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    paddingTop: 12,
  },
  image: {
    width: 250,
    height: 250,
  },
  scrollContainer: {
    backgroundColor: '#E9BC88',
    marginTop: 12,
    borderRadius: 18,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    marginHorizontal: 24,
    maxHeight: 320,
    flex: 1,
  },
  agentTextContainer: {

  },
  agentText: {
    fontSize: 22,
    color: '#333333',
    fontFamily: 'MonaSans-Regular',
  },
  pressed: {
    opacity: 0.5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 142,
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 40,
    color: '#333',
    marginTop: -4,
  },
  fabRecording: {
    backgroundColor: '#E9BC88',
  },
});
