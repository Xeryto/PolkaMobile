import React from 'react';
import { Button, View, StyleSheet } from 'react-native';

function Cart() {
    return (
        <View style={styles.container}>
            <Button title="Add to Cart" onPress={() => alert('Item added to cart!')}>
                
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default Cart;