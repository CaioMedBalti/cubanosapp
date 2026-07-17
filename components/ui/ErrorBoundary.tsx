import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

// Sem isso, um erro de render em qualquer tela derruba a árvore inteira do
// React e some sem rastro — o fundo escuro do tema vira uma "tela preta"
// silenciosa. Aqui pelo menos mostra o erro em vez de nada.
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>Algo quebrou</Text>
            <Text style={styles.message}>{this.state.error.message}</Text>
            <Text style={styles.stack}>{this.state.error.stack}</Text>
          </ScrollView>
          <TouchableOpacity style={styles.button} onPress={() => this.setState({ error: null })}>
            <Text style={styles.buttonText}>Tentar de novo</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0d0d', paddingTop: 60, paddingHorizontal: 20 },
  scroll: { paddingBottom: 20 },
  title: { color: '#ff6b6b', fontSize: 20, fontWeight: '800', marginBottom: 12 },
  message: { color: '#fff', fontSize: 15, marginBottom: 16 },
  stack: { color: '#aaa', fontSize: 11, fontFamily: 'monospace' },
  button: {
    marginHorizontal: 20,
    marginBottom: 40,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#000', fontWeight: '700' },
});
